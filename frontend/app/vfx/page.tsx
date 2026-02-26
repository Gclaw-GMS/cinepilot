'use client';

import { useState, useEffect, useCallback } from 'react';
import { Sparkles, Wand2, AlertTriangle, Film } from 'lucide-react';

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

const COMPLEXITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  simple: { bg: 'bg-slate-700/50', text: 'text-slate-300', border: 'border-slate-600' },
  moderate: { bg: 'bg-amber-900/30', text: 'text-amber-400', border: 'border-amber-700/50' },
  complex: { bg: 'bg-orange-900/30', text: 'text-orange-400', border: 'border-orange-700/50' },
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

  useEffect(() => {
    fetch('/api/scripts')
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data) ? data : data.scripts || [];
        setScripts(list);
      })
      .catch(() => setScripts([]));
  }, []);

  const fetchVfxData = useCallback(async (scriptId: string) => {
    if (!scriptId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/vfx?scriptId=${scriptId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to fetch');
      setVfxNotes(data.vfxNotes || []);
      setVfxWarnings(data.vfxWarnings || []);
      setVfxProps(data.props || []);
      setSummary(data.summary || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load VFX data');
      setVfxNotes([]);
      setVfxWarnings([]);
      setVfxProps([]);
      setSummary(null);
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
              <h1 className="text-2xl font-bold">VFX Breakdown</h1>
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
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 text-red-400 text-sm">
            {error}
          </div>
        )}

        {/* Summary Stats */}
        {summary && (
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
        )}

        {loading && (
          <div className="text-center py-12 text-slate-400">Loading VFX data...</div>
        )}

        {!loading && selectedScript && sortedScenes.length === 0 && (
          <div className="text-center py-12 text-slate-500">
            No VFX data found. Run a VFX analysis to scan this script.
          </div>
        )}

        {/* Scene-by-scene breakdown */}
        {sortedScenes.length > 0 && (
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
      </div>
    </div>
  );
}
