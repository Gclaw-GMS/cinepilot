'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Sparkles, Wand2, AlertTriangle, Film, Loader2, BarChart3, PieChart, RefreshCw, Download } from 'lucide-react';
import { 
  PieChart as RechartsPie, Pie, Cell, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';

type Script = { id: string; title: string };

type VfxNote = {
  id: string;
  sceneId: string;
  description: string;
  vfxType: string;
  confidence: number;
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
};

type VfxData = {
  vfxNotes: VfxNote[];
  vfxWarnings: VfxWarning[];
  props: VfxProp[];
  summary: Summary;
};

// Demo data for when no script is uploaded or API fails
const DEMO_VFX_DATA: VfxData = {
  vfxNotes: [
    { id: 'v1', sceneId: 's1', description: 'Massive crowd simulation for festival sequence - 500+ digital extras required', vfxType: 'crowd', confidence: 0.92, scene: { sceneNumber: '12', headingRaw: 'EXT. TEMPLE FESTIVAL - NIGHT', sceneIndex: 11 } },
    { id: 'v2', sceneId: 's1', description: 'Dynamic lighting effects for diyas and fireworks', vfxType: 'lighting', confidence: 0.85, scene: { sceneNumber: '12', headingRaw: 'EXT. TEMPLE FESTIVAL - NIGHT', sceneIndex: 11 } },
    { id: 'v3', sceneId: 's3', description: 'Car chase with vehicle replacements and plate matching', vfxType: 'action', confidence: 0.88, scene: { sceneNumber: '25', headingRaw: 'EXT. HIGHWAY - DAY', sceneIndex: 24 } },
    { id: 'v4', sceneId: 's4', description: 'Dream sequence with surreal floating elements and morphing', vfxType: 'fantasy', confidence: 0.95, scene: { sceneNumber: '31', headingRaw: 'INT. DREAM WORLD - FANTASY', sceneIndex: 30 } },
    { id: 'v5', sceneId: 's5', description: 'Green screen composite for romantic song sequence', vfxType: 'composite', confidence: 0.78, scene: { sceneNumber: '38', headingRaw: 'EXT. SWISS ALPS - DAY', sceneIndex: 37 } },
    { id: 'v6', sceneId: 's6', description: 'Explosion with fire and debris simulation', vfxType: 'destruction', confidence: 0.91, scene: { sceneNumber: '45', headingRaw: 'EXT. WAREHOUSE - NIGHT', sceneIndex: 44 } },
    { id: 'v7', sceneId: 's7', description: 'Sky replacement for mood enhancement', vfxType: 'beauty', confidence: 0.65, scene: { sceneNumber: '52', headingRaw: 'EXT. CITY ROOFTOP - DAY', sceneIndex: 51 } },
    { id: 'v8', sceneId: 's8', description: 'Creature makeup enhancement and digital aging', vfxType: 'prosthetic', confidence: 0.89, scene: { sceneNumber: '58', headingRaw: 'INT. LABORATORY - DAY', sceneIndex: 57 } },
  ],
  vfxWarnings: [
    { id: 'w1', sceneId: 's3', warningType: 'budget', description: 'High-budget car chase sequence may exceed VFX allocation', severity: 'high', scene: { sceneNumber: '25', headingRaw: 'EXT. HIGHWAY - DAY', sceneIndex: 24 } },
    { id: 'w2', sceneId: 's4', warningType: 'schedule', description: 'Complex fantasy sequence requires extended render time', severity: 'medium', scene: { sceneNumber: '31', headingRaw: 'INT. DREAM WORLD - FANTASY', sceneIndex: 30 } },
    { id: 'w3', sceneId: 's6', warningType: 'safety', description: 'Explosion sequence needs stunt coordination', severity: 'low', scene: { sceneNumber: '45', headingRaw: 'EXT. WAREHOUSE - NIGHT', sceneIndex: 44 } },
  ],
  props: [
    { id: 'p1', scene: { sceneNumber: '12', headingRaw: 'EXT. TEMPLE FESTIVAL - NIGHT' }, prop: { name: 'Fireworks', description: 'CG pyrotechnics for festival celebration' } },
    { id: 'p2', scene: { sceneNumber: '25', headingRaw: 'EXT. HIGHWAY - DAY' }, prop: { name: 'Stunt Car', description: 'Digital vehicle for dangerous stunts' } },
    { id: 'p3', scene: { sceneNumber: '31', headingRaw: 'INT. DREAM WORLD - FANTASY' }, prop: { name: 'Floating Rocks', description: 'CG environment elements' } },
    { id: 'p4', scene: { sceneNumber: '38', headingRaw: 'EXT. SWISS ALPS - DAY' }, prop: { name: 'Mountain Background', description: 'Digital matte painting' } },
  ],
  summary: {
    totalScenes: 6,
    totalNotes: 8,
    totalWarnings: 3,
    complexityBreakdown: { simple: 1, moderate: 2, complex: 5 },
  },
};

const DEMO_SCRIPTS: Script[] = [
  { id: 'demo-1', title: 'Kaadhal Enbadhu (Demo)' },
  { id: 'demo-2', title: 'Vikram Vedha 2 (Demo)' },
];

const COMPLEXITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  simple: { bg: 'bg-slate-700/50', text: 'text-slate-300', border: 'border-slate-600' },
  moderate: { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-700/50' },
  complex: { bg: 'bg-orange-900/30', text: 'text-orange-400', border: 'border-orange-700/50' },
};

const VFX_TYPE_COLORS: Record<string, string> = {
  crowd: '#8b5cf6',
  lighting: '#f59e0b',
  action: '#ef4444',
  fantasy: '#ec4899',
  composite: '#06b6d4',
  destruction: '#dc2626',
  beauty: '#10b981',
  prosthetic: '#6366f1',
};

function getComplexity(confidence: number): string {
  if (confidence >= 0.8) return 'complex';
  if (confidence >= 0.5) return 'moderate';
  return 'simple';
}

function getComplexityStyle(complexity: string) {
  return COMPLEXITY_STYLES[complexity] || COMPLEXITY_STYLES.simple;
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
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Fetch scripts on mount
  useEffect(() => {
    fetch('/api/scripts')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.scripts || [];
        if (list.length > 0) {
          setScripts(list);
          // Auto-select first script
          setSelectedScript(list[0].id);
        } else {
          // Use demo scripts if none available
          setScripts(DEMO_SCRIPTS);
          setSelectedScript(DEMO_SCRIPTS[0].id);
          setIsDemoMode(true);
        }
      })
      .catch(() => {
        // Fallback to demo scripts on error
        setScripts(DEMO_SCRIPTS);
        setSelectedScript(DEMO_SCRIPTS[0].id);
        setIsDemoMode(true);
      });
  }, []);

  const fetchVfxData = useCallback(async (scriptId: string) => {
    if (!scriptId) return;
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`/api/vfx?scriptId=${scriptId}`);
      const data = await res.json();
      
      if (!res.ok) {
        // If API fails, use demo data
        console.log('Using demo VFX data');
        setVfxNotes(DEMO_VFX_DATA.vfxNotes);
        setVfxWarnings(DEMO_VFX_DATA.vfxWarnings);
        setVfxProps(DEMO_VFX_DATA.props);
        setSummary(DEMO_VFX_DATA.summary);
        setIsDemoMode(true);
      } else {
        setVfxNotes(data.vfxNotes || []);
        setVfxWarnings(data.vfxWarnings || []);
        setVfxProps(data.props || []);
        setSummary(data.summary || null);
        // Check for isDemo flag in response body (new API format)
        setIsDemoMode(data.isDemoMode === true);
      }
    } catch (err) {
      // Use demo data on error
      console.log('Using demo VFX data (error)');
      setVfxNotes(DEMO_VFX_DATA.vfxNotes);
      setVfxWarnings(DEMO_VFX_DATA.vfxWarnings);
      setVfxProps(DEMO_VFX_DATA.props);
      setSummary(DEMO_VFX_DATA.summary);
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load VFX data when script changes
  useEffect(() => {
    if (selectedScript) {
      fetchVfxData(selectedScript);
    }
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

  function loadDemoData() {
    setVfxNotes(DEMO_VFX_DATA.vfxNotes);
    setVfxWarnings(DEMO_VFX_DATA.vfxWarnings);
    setVfxProps(DEMO_VFX_DATA.props);
    setSummary(DEMO_VFX_DATA.summary);
    setIsDemoMode(true);
  }

  // Export VFX data as CSV
  function exportToCSV() {
    if (vfxNotes.length === 0 && vfxWarnings.length === 0) return;
    
    const rows = [['Scene', 'Type', 'Description', 'Confidence', 'Severity', 'Warning Type']];
    
    // Add VFX notes
    vfxNotes.forEach(note => {
      rows.push([
        note.scene.sceneNumber,
        note.vfxType,
        `"${note.description.replace(/"/g, '""')}"`,
        `${Math.round(note.confidence * 100)}%`,
        getComplexity(note.confidence),
        ''
      ]);
    });
    
    // Add warnings
    vfxWarnings.forEach(warn => {
      rows.push([
        warn.scene.sceneNumber,
        'Warning',
        `"${warn.description.replace(/"/g, '""')}"`,
        '',
        warn.severity,
        warn.warningType
      ]);
    });
    
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `vfx-breakdown-${selectedScript || 'demo'}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Group data by scene
  const sceneGroups = useMemo(() => {
    const groups = new Map<string, { heading: string | null; notes: VfxNote[]; warnings: VfxWarning[]; props: VfxProp[] }>();
    
    for (const note of vfxNotes) {
      const key = note.scene.sceneNumber;
      if (!groups.has(key)) {
        groups.set(key, { heading: note.scene.headingRaw, notes: [], warnings: [], props: [] });
      }
      groups.get(key)!.notes.push(note);
    }
    for (const warn of vfxWarnings) {
      const key = warn.scene.sceneNumber;
      if (!groups.has(key)) {
        groups.set(key, { heading: warn.scene.headingRaw, notes: [], warnings: [], props: [] });
      }
      groups.get(key)!.warnings.push(warn);
    }
    for (const prop of vfxProps) {
      const key = prop.scene.sceneNumber;
      if (!groups.has(key)) {
        groups.set(key, { heading: prop.scene.headingRaw, notes: [], warnings: [], props: [] });
      }
      groups.get(key)!.props.push(prop);
    }
    
    return [...groups.entries()].sort((a, b) => {
      const aIdx = vfxNotes.find((n) => n.scene.sceneNumber === a[0])?.scene.sceneIndex ?? 0;
      const bIdx = vfxNotes.find((n) => n.scene.sceneNumber === b[0])?.scene.sceneIndex ?? 0;
      return aIdx - bIdx;
    });
  }, [vfxNotes, vfxWarnings, vfxProps]);

  // Chart data
  const complexityChartData = useMemo(() => {
    if (!summary) return [];
    return [
      { name: 'Simple', value: summary.complexityBreakdown.simple, color: '#64748b' },
      { name: 'Moderate', value: summary.complexityBreakdown.moderate, color: '#f59e0b' },
      { name: 'Complex', value: summary.complexityBreakdown.complex, color: '#ef4444' },
    ];
  }, [summary]);

  const vfxTypeChartData = useMemo(() => {
    const typeCounts: Record<string, number> = {};
    vfxNotes.forEach(note => {
      typeCounts[note.vfxType] = (typeCounts[note.vfxType] || 0) + 1;
    });
    return Object.entries(typeCounts).map(([type, count]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      count,
      color: VFX_TYPE_COLORS[type] || '#8b5cf6',
    }));
  }, [vfxNotes]);

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                VFX Breakdown
                {isDemoMode && (
                  <span className="text-xs px-2 py-0.5 bg-amber-500/20 text-amber-400 rounded-full font-medium">
                    Demo
                  </span>
                )}
              </h1>
              <p className="text-sm text-slate-400">
                Scene-by-scene visual effects requirements and complexity analysis
              </p>
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
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
                onClick={loadDemoData}
                className="p-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-slate-300 transition-colors"
                title="Load demo data"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <button
              onClick={runAnalysis}
              disabled={!selectedScript || analyzing}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-700 disabled:text-slate-500 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
            >
              <Wand2 className={`w-4 h-4 ${analyzing ? 'animate-spin' : ''}`} />
              {analyzing ? 'Analyzing...' : 'Run VFX Analysis'}
            </button>

            {(vfxNotes.length > 0 || vfxWarnings.length > 0) && (
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 rounded-lg px-4 py-2 text-sm font-medium transition-colors"
                title="Export VFX breakdown as CSV"
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

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <span className="ml-3 text-slate-400">Loading VFX data...</span>
          </div>
        )}

        {/* Summary Stats */}
        {!loading && summary && (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
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
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span className="text-xs text-slate-400">Warnings</span>
                </div>
                <div className="text-2xl font-bold text-amber-400">{summary.totalWarnings}</div>
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

            {/* Charts Row */}
            {vfxNotes.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Complexity Pie Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5 text-purple-400" />
                    Complexity Distribution
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsPie>
                        <Pie
                          data={complexityChartData}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {complexityChartData.map((entry, index) => (
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

                {/* VFX Type Bar Chart */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-purple-400" />
                    VFX Type Breakdown
                  </h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={vfxTypeChartData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis type="number" stroke="#64748b" fontSize={12} />
                        <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={12} width={80} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        />
                        <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                          {vfxTypeChartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}

            {/* Scene-by-scene breakdown */}
            {sceneGroups.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Film className="w-5 h-5 text-purple-400" />
                  Scene-by-Scene Breakdown
                </h2>
                {sceneGroups.map(([sceneNumber, group]) => {
                  const maxConfidence = Math.max(
                    ...group.notes.map((n) => n.confidence),
                    0,
                  );
                  const complexity = getComplexity(maxConfidence);
                  const compStyle = getComplexityStyle(complexity);

                  return (
                    <div
                      key={sceneNumber}
                      className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-800/30">
                        <div className="flex items-center gap-3">
                          <span className="text-sm font-mono text-purple-400">
                            Scene {sceneNumber}
                          </span>
                          {group.heading && (
                            <span className="text-sm text-slate-300">{group.heading}</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          {group.notes.length > 0 && (
                            <span className="text-xs px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full">
                              {group.notes.length} VFX
                            </span>
                          )}
                          {group.warnings.length > 0 && (
                            <span className="text-xs px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full">
                              {group.warnings.length} Warning
                            </span>
                          )}
                          <span
                            className={`text-xs px-2 py-1 rounded-full font-medium ${compStyle.bg} ${compStyle.text} border ${compStyle.border}`}
                          >
                            {complexity}
                          </span>
                        </div>
                      </div>

                      <div className="p-4 space-y-3">
                        {group.notes.map((note) => (
                          <div key={note.id} className="flex items-start gap-3">
                            <div 
                              className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                              style={{ backgroundColor: `${VFX_TYPE_COLORS[note.vfxType] || '#8b5cf6'}20` }}
                            >
                              <Sparkles 
                                className="w-4 h-4" 
                                style={{ color: VFX_TYPE_COLORS[note.vfxType] || '#8b5cf6' }} 
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-slate-200">{note.description}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-slate-500 capitalize">
                                  {note.vfxType}
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
                              <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded ${
                                warn.severity === 'high' ? 'bg-red-500/20 text-red-400' :
                                warn.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-slate-700 text-slate-400'
                              }`}>
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

                        {group.notes.length === 0 && group.warnings.length === 0 && group.props.length === 0 && (
                          <p className="text-sm text-slate-500 italic">No VFX requirements for this scene</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && sceneGroups.length === 0 && (
              <div className="text-center py-12 text-slate-500 bg-slate-900/50 rounded-xl border border-slate-800">
                <Sparkles className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                <p className="text-lg font-medium text-slate-400">No VFX data found</p>
                <p className="text-sm mt-1">Run a VFX analysis to scan this script for visual effects.</p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
