'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Wand2, AlertTriangle, Film, BarChart3, TrendingUp, AlertCircle, CheckCircle, Download, DollarSign, Clock } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

type Script = { id: string; title: string };

type VfxNote = {
  id: string;
  sceneId: string;
  description: string;
  vfxType: string;
  confidence: number;
  estimatedDuration?: number;
  scene: { sceneNumber: string; headingRaw: string | null; sceneIndex: number };
};

type VfxWarning = {
  id: string;
  sceneId: string;
  warningType: string;
  description: string;
  severity: string;
  scene: { sceneNumber: string; headingRaw: string | null; sceneIndex: number };
};

type VfxProp = {
  id: string;
  scene: { sceneNumber: string; headingRaw: string | null };
  prop: { name: string; description: string | null };
};

type Summary = {
  totalScenes: number;
  totalNotes: number;
  totalWarnings: number;
  complexityBreakdown: { simple: number; moderate: number; complex: number };
  estimatedTotalCost: number;
  estimatedTotalDuration: number;
};

// VFX Cost estimation constants (in INR per second)
const VFX_COST_PER_SECOND = {
  simple: 5000,
  moderate: 15000,
  complex: 45000,
};

const VFX_CATEGORIES = [
  { key: 'cgi', label: 'CGI', color: '#8b5cf6' },
  { key: 'compositing', label: 'Compositing', color: '#06b6d4' },
  { key: 'wire_removal', label: 'Wire Removal', color: '#10b981' },
  { key: 'matte_painting', label: 'Matte Painting', color: '#ef4444' },
  { key: 'simulation', label: 'Simulation', color: '#ec4899' },
  { key: 'enhancement', label: 'Enhancement', color: '#64748b' },
  { key: 'explicit', label: 'Explicit VFX', color: '#f97316' },
  { key: 'implied', label: 'Implied VFX', color: '#84cc16' },
];

// Demo data for when no real data exists
const DEMO_VFX_NOTES: VfxNote[] = [
  { id: 'demo-1', sceneId: 's1', description: 'Explosion sequence with fire and debris - requires CGI fire simulation', vfxType: 'explicit', confidence: 0.92, scene: { sceneNumber: '12', headingRaw: 'EXT. WAREHOUSE - NIGHT', sceneIndex: 11 } },
  { id: 'demo-2', sceneId: 's1', description: 'Bullet time effect during the chase - wire removal needed', vfxType: 'explicit', confidence: 0.85, scene: { sceneNumber: '15', headingRaw: 'EXT. CITY STREETS - NIGHT', sceneIndex: 14 } },
  { id: 'demo-3', sceneId: 's2', description: 'Supernatural glow around character hands - digital enhancement', vfxType: 'explicit', confidence: 0.78, scene: { sceneNumber: '23', headingRaw: 'INT. TEMPLE - NIGHT', sceneIndex: 22 } },
  { id: 'demo-4', sceneId: 's3', description: 'City skyline with digital matte painting for timeline change', vfxType: 'implied', confidence: 0.65, scene: { sceneNumber: '5', headingRaw: 'EXT. ROOFTOP - SUNSET', sceneIndex: 4 } },
  { id: 'demo-5', sceneId: 's4', description: 'Blood splatter removal for UA certificate', vfxType: 'explicit', confidence: 0.55, scene: { sceneNumber: '31', headingRaw: 'INT. WAREHOUSE - NIGHT', sceneIndex: 30 } },
  { id: 'demo-6', sceneId: 's5', description: 'Reflective eyes effect for the antagonist', vfxType: 'implied', confidence: 0.42, scene: { sceneNumber: '18', headingRaw: 'INT. VILLAIN LAIR - NIGHT', sceneIndex: 17 } },
  { id: 'demo-7', sceneId: 's6', description: 'Weather effects - rain and mist for atmosphere', vfxType: 'implied', confidence: 0.35, scene: { sceneNumber: '8', headingRaw: 'EXT. FOREST - NIGHT', sceneIndex: 7 } },
];

const DEMO_VFX_WARNINGS: VfxWarning[] = [
  { id: 'w1', sceneId: 's1', warningType: 'vfx', description: 'High VFX complexity detected - budget impact likely for Scene 12', severity: 'high', scene: { sceneNumber: '12', headingRaw: 'EXT. WAREHOUSE - NIGHT', sceneIndex: 11 } },
  { id: 'w2', sceneId: 's2', warningType: 'vfx', description: 'Bullet time effect requires specialized crew - check availability', severity: 'medium', scene: { sceneNumber: '15', headingRaw: 'EXT. CITY STREETS - NIGHT', sceneIndex: 14 } },
  { id: 'w3', sceneId: 's3', warningType: 'vfx', description: 'Scene 23 glow effect may affect certification - review content', severity: 'medium', scene: { sceneNumber: '23', headingRaw: 'INT. TEMPLE - NIGHT', sceneIndex: 22 } },
];

const DEMO_VFX_PROPS: VfxProp[] = [
  { id: 'p1', scene: { sceneNumber: '12', headingRaw: 'EXT. WAREHOUSE - NIGHT' }, prop: { name: 'Explosion Debris', description: 'CGI debris particles' } },
  { id: 'p2', scene: { sceneNumber: '23', headingRaw: 'INT. TEMPLE - NIGHT' }, prop: { name: 'Supernatural Glow', description: 'Digital aura effect' } },
];

const DEMO_SUMMARY: Summary = {
  totalScenes: 7,
  totalNotes: 9,
  totalWarnings: 4,
  complexityBreakdown: { simple: 3, moderate: 3, complex: 3 },
  estimatedTotalCost: 6765000,
  estimatedTotalDuration: 225,
};

const DEMO_SCRIPTS: Script[] = [
  { id: 'demo-script-1', title: 'Thunivu (Demo Script)' },
  { id: 'demo-script-2', title: 'Jawan (Demo Script)' },
];

const COMPLEXITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  simple: { bg: 'bg-slate-700/50', text: 'text-slate-300', border: 'border-slate-600' },
  moderate: { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-700/50' },
  complex: { bg: 'bg-orange-900/30', text: 'text-orange-400', border: 'border-orange-700/50' },
};

const CHART_COLORS = ['#10b981', '#f59e0b', '#ef4444'];

function getComplexity(confidence: number): string {
  if (confidence >= 0.8) return 'complex';
  if (confidence >= 0.5) return 'moderate';
  return 'simple';
}

function getComplexityStyle(complexity: string) {
  return COMPLEXITY_STYLES[complexity] || COMPLEXITY_STYLES.simple;
}

function getVfxCategoryColor(vfxType: string): string {
  const category = VFX_CATEGORIES.find(c => c.key === vfxType);
  return category?.color || '#64748b';
}

function formatCurrency(amount: number): string {
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`;
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}K`;
  return `₹${amount}`;
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  if (hours > 0) return `${hours}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export default function VfxPage() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScript, setSelectedScript] = useState('');
  const [vfxNotes, setVfxNotes] = useState<VfxNote[]>([]);
  const [vfxWarnings, setVfxWarnings] = useState<VfxWarning[]>([]);
  const [vfxProps, setVfxProps] = useState<VfxProp[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [isUsingDemo, setIsUsingDemo] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'scenes' | 'cost'>('overview');

  useEffect(() => {
    fetch('/api/scripts')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.scripts || [];
        if (list.length > 0) {
          setScripts(list);
          // Auto-select first script if available
          setSelectedScript(list[0].id);
        } else {
          // Use demo scripts if no real scripts exist
          setScripts(DEMO_SCRIPTS);
          setIsUsingDemo(true);
          // Auto-select first demo script
          if (DEMO_SCRIPTS.length > 0) {
            setSelectedScript(DEMO_SCRIPTS[0].id);
          }
        }
      })
      .catch(() => {
        // Fallback to demo scripts on error
        setScripts(DEMO_SCRIPTS);
        setIsUsingDemo(true);
        // Auto-select first demo script
        if (DEMO_SCRIPTS.length > 0) {
          setSelectedScript(DEMO_SCRIPTS[0].id);
        }
      });
  }, []);

  // Calculate cost and duration from VFX notes
  const calculateSummaryCost = useCallback((notes: VfxNote[], warnings: VfxWarning[]) => {
    const complexityBreakdown = { simple: 0, moderate: 0, complex: 0 };
    let totalCost = 0;
    let totalDuration = 0;

    for (const note of notes) {
      const complexity = getComplexity(note.confidence);
      complexityBreakdown[complexity as keyof typeof complexityBreakdown]++;
      const costPerSec = VFX_COST_PER_SECOND[complexity as keyof typeof VFX_COST_PER_SECOND];
      totalCost += costPerSec * (note.estimatedDuration || 30);
      totalDuration += note.estimatedDuration || 30;
    }

    const sceneSet = new Set(notes.map(n => n.scene.sceneNumber));

    return {
      totalScenes: sceneSet.size,
      totalNotes: notes.length,
      totalWarnings: warnings.length,
      complexityBreakdown,
      estimatedTotalCost: totalCost,
      estimatedTotalDuration: totalDuration,
    };
  }, []);

  const fetchVfxData = useCallback(async (scriptId: string) => {
    if (!scriptId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/vfx?scriptId=${scriptId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      
      // Use real data if available, otherwise use demo data
      if (data.vfxNotes && data.vfxNotes.length > 0) {
        setVfxNotes(data.vfxNotes || []);
        setVfxWarnings(data.vfxWarnings || []);
        setVfxProps(data.props || []);
        setSummary(calculateSummaryCost(data.vfxNotes || [], data.vfxWarnings || []));
        setIsUsingDemo(false);
      } else {
        // Load demo data when no real data exists
        setVfxNotes(DEMO_VFX_NOTES);
        setVfxWarnings(DEMO_VFX_WARNINGS);
        setVfxProps(DEMO_VFX_PROPS);
        setSummary(DEMO_SUMMARY);
        setIsUsingDemo(true);
      }
    } catch (err) {
      // On error, load demo data for better UX
      console.warn('Using demo VFX data:', err);
      setVfxNotes(DEMO_VFX_NOTES);
      setVfxWarnings(DEMO_VFX_WARNINGS);
      setVfxProps(DEMO_VFX_PROPS);
      setSummary(DEMO_SUMMARY);
      setIsUsingDemo(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedScript) fetchVfxData(selectedScript);
  }, [selectedScript, fetchVfxData]);

  async function runAnalysis() {
    if (!selectedScript) return;
    setAnalyzing(true);
    setError('');
    try {
      const res = await fetch('/api/vfx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId: selectedScript }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      await fetchVfxData(selectedScript);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'VFX analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  // Export VFX data to CSV
  function handleExport() {
    const headers = ['Scene', 'Heading', 'Type', 'Description', 'Confidence', 'Severity', 'Warning'];
    const rows = sortedScenes.map(([sceneNum, group]) => {
      const notes = group.notes.map(n => ({
        scene: sceneNum,
        heading: group.heading || '',
        type: n.vfxType,
        description: n.description,
        confidence: Math.round(n.confidence * 100) + '%',
        severity: '',
        warning: ''
      }));
      const warnings = group.warnings.map(w => ({
        scene: sceneNum,
        heading: group.heading || '',
        type: w.warningType,
        description: w.description,
        confidence: '',
        severity: w.severity,
        warning: w.description
      }));
      return [...notes, ...warnings];
    }).flat();

    const csv = [headers, ...rows.map(r => [r.scene, r.heading, r.type, r.description, r.confidence, r.severity, r.warning].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vfx-breakdown-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const sceneGroups = new Map<
    string,
    { heading: string | null; notes: VfxNote[]; warnings: VfxWarning[]; props: VfxProp[] }
  >();
  for (const note of vfxNotes) {
    const key = note.scene.sceneNumber;
    if (!sceneGroups.has(key)) {
      sceneGroups.set(key, { heading: note.scene.headingRaw, notes: [], warnings: [], props: [] });
    }
    sceneGroups.get(key)!.notes.push(note);
  }
  for (const warn of vfxWarnings) {
    const key = warn.scene.sceneNumber;
    if (!sceneGroups.has(key)) {
      sceneGroups.set(key, { heading: warn.scene.headingRaw, notes: [], warnings: [], props: [] });
    }
    sceneGroups.get(key)!.warnings.push(warn);
  }
  for (const prop of vfxProps) {
    const key = prop.scene.sceneNumber;
    if (!sceneGroups.has(key)) {
      sceneGroups.set(key, { heading: prop.scene.headingRaw, notes: [], warnings: [], props: [] });
    }
    sceneGroups.get(key)!.props.push(prop);
  }

  const sortedScenes = [...sceneGroups.entries()].sort((a, b) => {
    const aIdx = vfxNotes.find((n) => n.scene.sceneNumber === a[0])?.scene.sceneIndex ?? 0;
    const bIdx = vfxNotes.find((n) => n.scene.sceneNumber === b[0])?.scene.sceneIndex ?? 0;
    return aIdx - bIdx;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600/20 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">VFX Breakdown</h1>
                {isUsingDemo && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/15 text-amber-400 text-xs rounded-full border border-amber-500/30">
                    <AlertCircle className="w-3 h-3" />
                    Demo Data
                  </span>
                )}
              </div>
              <p className="text-sm text-slate-400">
                Scene-by-scene visual effects requirements and complexity analysis
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
              className="bg-slate-800 border border-slate-700 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500 min-w-[240px]"
            >
              <option value="">Select a script...</option>
              {scripts.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>

            <button
              onClick={runAnalysis}
              disabled={!selectedScript || analyzing}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <Wand2 className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
              {analyzing ? 'Analyzing...' : 'Run VFX Analysis'}
            </button>

            {vfxNotes.length > 0 && (
              <button
                onClick={handleExport}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 rounded-lg px-4 py-2 text-sm font-medium transition-colors ml-auto"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Summary Stats */}
        {summary && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Film className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-slate-400">VFX Scenes</span>
                </div>
                <div className="text-2xl font-bold">{summary.totalScenes}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-slate-400">VFX Notes</span>
                </div>
                <div className="text-2xl font-bold">{summary.totalNotes}</div>
              </div>
              <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-900/20 border border-emerald-500/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs text-emerald-300">Est. Budget</span>
                </div>
                <div className="text-2xl font-bold text-emerald-400">{formatCurrency(summary.estimatedTotalCost)}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs text-slate-400">Est. Duration</span>
                </div>
                <div className="text-2xl font-bold">{formatDuration(summary.estimatedTotalDuration)}</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-400">Warnings</span>
                </div>
                <div className="text-2xl font-bold">{summary.totalWarnings}</div>
              </div>
              {(['simple', 'moderate', 'complex'] as const).map((level) => {
                const count = summary.complexityBreakdown[level];
                const style = getComplexityStyle(level);
                return (
                  <div
                    key={level}
                    className={`${style.bg} border ${style.border} rounded-xl p-4`}
                  >
                    <div className="text-xs text-slate-400 mb-2 capitalize">{level}</div>
                    <div className={`text-2xl font-bold ${style.text}`}>{count}</div>
                  </div>
                );
              })}
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 border-b border-slate-800 pb-px">
              <button
                onClick={() => setActiveTab('overview')}
                className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
                  activeTab === 'overview'
                    ? 'bg-purple-600/20 text-purple-400 border border-b-0 border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setActiveTab('scenes')}
                className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
                  activeTab === 'scenes'
                    ? 'bg-purple-600/20 text-purple-400 border border-b-0 border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Scenes
              </button>
              <button
                onClick={() => setActiveTab('cost')}
                className={`px-4 py-2 text-sm font-medium rounded-t transition-colors ${
                  activeTab === 'cost'
                    ? 'bg-purple-600/20 text-purple-400 border border-b-0 border-purple-500/30'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cost Analysis
              </button>
            </div>

            {/* Visualization Charts */}
            {vfxNotes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Complexity Distribution Pie Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    Complexity Distribution
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Simple', value: summary.complexityBreakdown.simple },
                            { name: 'Moderate', value: summary.complexityBreakdown.moderate },
                            { name: 'Complex', value: summary.complexityBreakdown.complex },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {[0, 1, 2].map((index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index]} />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                          itemStyle={{ color: '#e2e8f0' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Scene Complexity Bar Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                    Scene Complexity
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={sortedScenes.map(([sceneNum, group]) => {
                          const maxConf = Math.max(...group.notes.map(n => n.confidence), 0);
                          return {
                            scene: `S${sceneNum}`,
                            confidence: Math.round(maxConf * 100),
                            complexity: getComplexity(maxConf),
                          };
                        })}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="scene" stroke="#94a3b8" fontSize={12} />
                        <YAxis stroke="#94a3b8" fontSize={12} domain={[0, 100]} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                          itemStyle={{ color: '#e2e8f0' }}
                          formatter={(value: number) => [`${value}%`, 'Confidence']}
                        />
                        <Bar dataKey="confidence" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {loading && (
          <div className="text-center py-12 text-slate-400">Loading VFX data...</div>
        )}

        {!loading && selectedScript && sortedScenes.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No VFX data found. Run a VFX analysis to scan this script.
          </div>
        )}

        {/* Tab Content */}
        {sortedScenes.length > 0 && activeTab === 'overview' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Film className="w-5 h-5 text-purple-400" />
              Scene-by-Scene Breakdown
            </h2>
            {sortedScenes.map(([sceneNumber, group]) => {
              const maxConfidence = Math.max(
                ...group.notes.map((n) => n.confidence),
                0,
              );
              const complexity = getComplexity(maxConfidence);
              const compStyle = getComplexityStyle(complexity);

              return (
                <div
                  key={sceneNumber}
                  className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden"
                >
                  <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-mono text-slate-400">
                        Scene {sceneNumber}
                      </span>
                      {group.heading && (
                        <span className="text-sm text-slate-300">{group.heading}</span>
                      )}
                    </div>
                    <span
                      className={`text-xs px-2 py-1 rounded-full font-medium ${compStyle.bg} ${compStyle.text} border ${compStyle.border}`}
                    >
                      {complexity}
                    </span>
                  </div>

                  <div className="p-4 space-y-3">
                    {group.notes.map((note) => (
                      <div key={note.id} className="flex items-start gap-3">
                        <Sparkles className="w-4 h-4 text-purple-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200">{note.description}</p>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-xs text-slate-500">
                              {note.vfxType === 'explicit' ? 'Explicit' : 'Implied'}
                            </span>
                            <span className="text-xs text-slate-600">
                              Confidence: {Math.round(note.confidence * 100)}%
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {group.warnings.map((warn) => (
                      <div key={warn.id} className="flex items-start gap-3">
                        <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200">{warn.description}</p>
                          <span className="text-xs text-amber-500 mt-1 inline-block">
                            {warn.severity}
                          </span>
                        </div>
                      </div>
                    ))}

                    {group.props.map((prop) => (
                      <div key={prop.id} className="flex items-start gap-3">
                        <Wand2 className="w-4 h-4 text-slate-400 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200">{prop.prop.name}</p>
                          {prop.prop.description && (
                            <p className="text-xs text-slate-500 mt-0.5">
                              {prop.prop.description}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Cost Analysis Tab */}
        {sortedScenes.length > 0 && activeTab === 'cost' && summary && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gradient-to-br from-emerald-900/40 to-emerald-900/10 border border-emerald-500/30 rounded-xl p-6">
                <div className="text-sm text-emerald-400 mb-2">Total Estimated Cost</div>
                <div className="text-4xl font-bold text-emerald-400">{formatCurrency(summary.estimatedTotalCost)}</div>
                <div className="text-sm text-emerald-400/60 mt-2">Based on complexity analysis</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="text-sm text-slate-400 mb-2">Average Cost per Shot</div>
                <div className="text-4xl font-bold text-white">{formatCurrency(Math.round(summary.estimatedTotalCost / summary.totalNotes))}</div>
                <div className="text-sm text-slate-500 mt-2">Per VFX shot</div>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <div className="text-sm text-slate-400 mb-2">Estimated Duration</div>
                <div className="text-4xl font-bold text-white">{formatDuration(summary.estimatedTotalDuration)}</div>
                <div className="text-sm text-slate-500 mt-2">Render time</div>
              </div>
            </div>

            {/* Cost by Scene Chart */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Cost by Scene</h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={sortedScenes.map(([sceneNum, group]) => {
                      const cost = group.notes.reduce((sum, n) => {
                        const comp = getComplexity(n.confidence);
                        return sum + VFX_COST_PER_SECOND[comp as keyof typeof VFX_COST_PER_SECOND] * (n.estimatedDuration || 30);
                      }, 0);
                      return { scene: `S${sceneNum}`, cost: cost / 100000 };
                    })}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="scene" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `₹${v}L`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                      formatter={(value: number) => [formatCurrency(value * 100000), 'Cost']}
                    />
                    <Bar dataKey="cost" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Cost Breakdown Table */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Detailed Cost Breakdown</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Scene</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Shots</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-slate-400">Complexity</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Est. Duration</th>
                      <th className="text-right py-3 px-4 text-sm font-medium text-slate-400">Est. Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedScenes.map(([sceneNum, group]) => {
                      const maxConf = Math.max(...group.notes.map(n => n.confidence), 0);
                      const complexity = getComplexity(maxConf);
                      const compStyle = getComplexityStyle(complexity);
                      const totalDuration = group.notes.reduce((sum, n) => sum + (n.estimatedDuration || 30), 0);
                      const totalCost = group.notes.reduce((sum, n) => {
                        const comp = getComplexity(n.confidence);
                        return sum + VFX_COST_PER_SECOND[comp as keyof typeof VFX_COST_PER_SECOND] * (n.estimatedDuration || 30);
                      }, 0);

                      return (
                        <tr key={sceneNum} className="border-b border-slate-800">
                          <td className="py-3 px-4 text-sm">Scene {sceneNum}</td>
                          <td className="py-3 px-4 text-sm text-slate-400">{group.notes.length}</td>
                          <td className="py-3 px-4">
                            <span className={`text-xs px-2 py-1 rounded-full ${compStyle.bg} ${compStyle.text}`}>{complexity}</span>
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-400 text-right">{formatDuration(totalDuration)}</td>
                          <td className="py-3 px-4 text-sm text-emerald-400 text-right font-medium">{formatCurrency(totalCost)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-800/50">
                      <td className="py-4 px-4 font-semibold">Total</td>
                      <td className="py-4 px-4 text-slate-400">{summary.totalNotes} shots</td>
                      <td className="py-4 px-4"></td>
                      <td className="py-4 px-4 text-slate-400 text-right">{formatDuration(summary.estimatedTotalDuration)}</td>
                      <td className="py-4 px-4 text-emerald-400 text-right font-bold text-lg">{formatCurrency(summary.estimatedTotalCost)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
