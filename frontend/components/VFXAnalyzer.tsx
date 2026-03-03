'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { AlertCircle, CheckCircle, Film, DollarSign, Clock, Sparkles, RefreshCw, BarChart3 } from 'lucide-react';

interface VFXNote {
  id: string;
  description: string;
  vfxType: string;
  confidence: number;
  scene: { sceneNumber: string; headingRaw: string | null };
}

interface VFXWarning {
  id: string;
  description: string;
  severity: string;
  scene: { sceneNumber: string; headingRaw: string | null };
}

interface VFXSummary {
  totalScenes: number;
  totalNotes: number;
  totalWarnings: number;
  complexityBreakdown: { simple: number; moderate: number; complex: number };
  estimatedTotalCost: number;
  estimatedTotalDuration: number;
}

interface Script {
  id: string;
  title: string;
}

interface VFXAnalyzerProps {
  scenes?: any[];
  scriptId?: string;
}

// Demo data for preview
const DEMO_VFX_DATA = {
  vfxNotes: [
    { id: 'demo-1', description: 'Explosion sequence with fire and debris - requires CGI fire simulation', vfxType: 'explicit', confidence: 0.92, scene: { sceneNumber: '12', headingRaw: 'EXT. WAREHOUSE - NIGHT' } },
    { id: 'demo-2', description: 'Bullet time effect during the chase - wire removal needed', vfxType: 'explicit', confidence: 0.85, scene: { sceneNumber: '15', headingRaw: 'EXT. CITY STREETS - NIGHT' } },
    { id: 'demo-3', description: 'Supernatural glow around character hands - digital enhancement', vfxType: 'explicit', confidence: 0.78, scene: { sceneNumber: '23', headingRaw: 'INT. TEMPLE - NIGHT' } },
    { id: 'demo-4', description: 'City skyline with digital matte painting for timeline change', vfxType: 'implied', confidence: 0.65, scene: { sceneNumber: '5', headingRaw: 'EXT. ROOFTOP - SUNSET' } },
  ] as VFXNote[],
  vfxWarnings: [
    { id: 'w1', description: 'High VFX complexity detected - budget impact likely for Scene 12', severity: 'high', scene: { sceneNumber: '12', headingRaw: 'EXT. WAREHOUSE - NIGHT' } },
    { id: 'w2', description: 'Bullet time effect requires specialized crew - check availability', severity: 'medium', scene: { sceneNumber: '15', headingRaw: 'EXT. CITY STREETS - NIGHT' } },
  ] as VFXWarning[],
  summary: {
    totalScenes: 4,
    totalNotes: 4,
    totalWarnings: 2,
    complexityBreakdown: { simple: 1, moderate: 2, complex: 1 },
    estimatedTotalCost: 4250000,
    estimatedTotalDuration: 150,
  } as VFXSummary,
};

// VFX Cost estimation constants (in INR per second)
const VFX_COST_PER_SECOND = {
  simple: 5000,
  moderate: 15000,
  complex: 45000,
};

export default function VFXAnalyzer({ scenes = [], scriptId }: VFXAnalyzerProps) {
  const [results, setResults] = useState<{ vfxNotes: VFXNote[]; vfxWarnings: VFXWarning[]; summary: VFXSummary } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [selectedScriptId, setSelectedScriptId] = useState<string>(scriptId || '');
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Fetch available scripts on mount
  useEffect(() => {
    const fetchScripts = async () => {
      try {
        const res = await fetch('/api/scripts');
        const data = await res.json();
        if (data.scripts && data.scripts.length > 0) {
          setScripts(data.scripts);
          if (!selectedScriptId) {
            setSelectedScriptId(data.scripts[0].id);
          }
        } else {
          // No database - use demo mode
          setIsDemoMode(true);
          setResults(DEMO_VFX_DATA);
        }
      } catch (err) {
        console.error('Failed to fetch scripts:', err);
        setIsDemoMode(true);
        setResults(DEMO_VFX_DATA);
      }
    };
    fetchScripts();
  }, []);

  const analyze = async () => {
    setLoading(true);
    setError(null);

    // Use demo data if in demo mode or no script selected
    if (isDemoMode || !selectedScriptId) {
      // Simulate analysis delay for realism
      await new Promise(resolve => setTimeout(resolve, 1500));
      setResults(DEMO_VFX_DATA);
      setLoading(false);
      return;
    }

    try {
      // First, generate VFX notes from script
      const generateRes = await fetch('/api/vfx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId: selectedScriptId }),
      });

      if (!generateRes.ok) {
        const errorData = await generateRes.json();
        throw new Error(errorData.error || 'Failed to generate VFX analysis');
      }

      // Then fetch the results
      const fetchRes = await fetch(`/api/vfx?scriptId=${selectedScriptId}`);
      const data = await fetchRes.json();

      if (!fetchRes.ok) {
        throw new Error(data.error || 'Failed to fetch VFX data');
      }

      // Calculate estimated costs
      const estimatedCost = (data.vfxNotes || []).reduce((total: number, note: VFXNote) => {
        const duration = 5; // Default 5 seconds per VFX shot
        const complexity = note.confidence >= 0.8 ? 'complex' : note.confidence >= 0.5 ? 'moderate' : 'simple';
        return total + (VFX_COST_PER_SECOND[complexity as keyof typeof VFX_COST_PER_SECOND] * duration);
      }, 0);

      setResults({
        vfxNotes: data.vfxNotes || [],
        vfxWarnings: data.vfxWarnings || [],
        summary: {
          ...data.summary,
          estimatedTotalCost: estimatedCost || data.summary?.estimatedTotalCost || 0,
        },
      });
    } catch (err: any) {
      console.error('VFX Analysis error:', err);
      setError(err.message || 'Failed to analyze VFX requirements');
      // Fall back to demo data on error
      setResults(DEMO_VFX_DATA);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
    return `₹${amount.toLocaleString()}`;
  };

  const getComplexityColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-red-400';
    if (confidence >= 0.5) return 'text-yellow-400';
    return 'text-green-400';
  };

  const getComplexityLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'Complex';
    if (confidence >= 0.5) return 'Moderate';
    return 'Simple';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'bg-red-900/50 text-red-300 border-red-700';
      case 'medium': return 'bg-yellow-900/50 text-yellow-300 border-yellow-700';
      default: return 'bg-green-900/50 text-green-300 border-green-700';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-pink-400" />
          VFX Requirements Analysis
        </h3>
        {isDemoMode && (
          <span className="text-xs bg-yellow-900/50 text-yellow-300 px-2 py-1 rounded">
            Demo Mode
          </span>
        )}
      </div>

      {/* Script Selector */}
      {!isDemoMode && scripts.length > 0 && (
        <div className="mb-4">
          <label className="text-xs text-gray-400 mb-1 block">Select Script</label>
          <select
            value={selectedScriptId}
            onChange={(e) => setSelectedScriptId(e.target.value)}
            className="w-full bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white text-sm"
          >
            {scripts.map((script) => (
              <option key={script.id} value={script.id}>
                {script.title}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Analyze Button */}
      <button
        onClick={analyze}
        disabled={loading}
        className="bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white px-4 py-2 rounded-lg disabled:opacity-50 w-full mb-4 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Analyze VFX Requirements
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-3 mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
      
      {results && (
        <div className="space-y-4">
          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <Film className="w-5 h-5 text-purple-400 mx-auto mb-1" />
              <p className="text-gray-400 text-xs">VFX Scenes</p>
              <p className="text-2xl font-bold text-white">{results.summary?.totalScenes || results.vfxNotes?.length || 0}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <DollarSign className="w-5 h-5 text-pink-400 mx-auto mb-1" />
              <p className="text-gray-400 text-xs">Est. Cost</p>
              <p className="text-xl font-bold text-pink-400">{formatCurrency(results.summary?.estimatedTotalCost || 0)}</p>
            </div>
          </div>

          {/* Complexity Breakdown */}
          {results.summary?.complexityBreakdown && (
            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                Complexity Breakdown
              </h4>
              <div className="flex gap-2">
                <div className="flex-1 bg-green-900/30 rounded-lg p-2 text-center">
                  <p className="text-green-400 font-bold text-lg">{results.summary.complexityBreakdown.simple}</p>
                  <p className="text-xs text-gray-400">Simple</p>
                </div>
                <div className="flex-1 bg-yellow-900/30 rounded-lg p-2 text-center">
                  <p className="text-yellow-400 font-bold text-lg">{results.summary.complexityBreakdown.moderate}</p>
                  <p className="text-xs text-gray-400">Moderate</p>
                </div>
                <div className="flex-1 bg-red-900/30 rounded-lg p-2 text-center">
                  <p className="text-red-400 font-bold text-lg">{results.summary.complexityBreakdown.complex}</p>
                  <p className="text-xs text-gray-400">Complex</p>
                </div>
              </div>
            </div>
          )}
          
          {/* VFX Notes List */}
          {results.vfxNotes && results.vfxNotes.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                <Film className="w-4 h-4 text-pink-400" />
                VFX Shots ({results.vfxNotes.length})
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {results.vfxNotes.map((note, i) => (
                  <div key={note.id || i} className="bg-gray-800 rounded-lg p-3 border border-gray-700">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-purple-400 font-medium text-sm">
                          Scene {note.scene?.sceneNumber}
                        </p>
                        <p className="text-gray-500 text-xs">{note.scene?.headingRaw}</p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded border ${getComplexityColor(note.confidence)} bg-gray-900/50`}>
                        {getComplexityLabel(note.confidence)}
                      </span>
                    </div>
                    <p className="text-gray-300 text-sm">{note.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded">
                        {note.vfxType}
                      </span>
                      <span className="text-xs text-gray-500">
                        {Math.round(note.confidence * 100)}% confidence
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Warnings */}
          {results.vfxWarnings && results.vfxWarnings.length > 0 && (
            <div className="bg-red-900/20 rounded-lg p-4 border border-red-800">
              <h4 className="text-red-400 font-semibold mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Warnings ({results.vfxWarnings.length})
              </h4>
              <div className="space-y-2">
                {results.vfxWarnings.map((warning, i) => (
                  <div key={warning.id || i} className={`rounded-lg p-3 border ${getSeverityColor(warning.severity)}`}>
                    <div className="flex items-start gap-2">
                      <span className="text-xs uppercase font-bold bg-black/30 px-2 py-0.5 rounded">
                        {warning.severity}
                      </span>
                      <div>
                        <p className="text-sm font-medium">Scene {warning.scene?.sceneNumber}</p>
                        <p className="text-xs opacity-80">{warning.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Duration Estimate */}
          {results.summary?.estimatedTotalDuration > 0 && (
            <div className="bg-gradient-to-r from-purple-900/50 to-pink-900/50 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-purple-400" />
                <span className="text-gray-300">Estimated Duration</span>
              </div>
              <span className="text-xl font-bold text-white">
                {Math.round((results.summary.estimatedTotalDuration || 0) / 60)}m {((results.summary.estimatedTotalDuration || 0) % 60)}s
              </span>
            </div>
          )}
          
          {/* Success State */}
          {results.vfxNotes?.length === 0 && (
            <div className="bg-green-900/20 rounded-lg p-6 border border-green-800 text-center">
              <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-2" />
              <p className="text-green-300 font-semibold">No VFX Required</p>
              <p className="text-green-400/70 text-sm">Your script doesn't require any visual effects</p>
            </div>
          )}
        </div>
      )}
      
      {(!results && !loading) && (
        <div className="text-center text-gray-500 py-8">
          <Sparkles className="w-12 h-12 mx-auto mb-2 text-gray-600" />
          <p>Click "Analyze VFX Requirements" to scan your script</p>
        </div>
      )}
    </motion.div>
  );
}
