'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface VFXAnalyzerProps {
  scenes?: any[];
}

export default function VFXAnalyzer({ scenes = [] }: VFXAnalyzerProps) {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/vfx-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes }),
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)} Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)} L`;
    return `₹${amount.toLocaleString()}`;
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      default: return 'text-green-400';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700"
    >
      <h3 className="text-xl font-bold text-white mb-4">🎨 VFX Requirements Analysis</h3>
      
      <button
        onClick={analyze}
        disabled={loading || scenes.length === 0}
        className="bg-pink-600 hover:bg-pink-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 w-full mb-4"
      >
        {loading ? 'Analyzing...' : 'Analyze VFX Requirements'}
      </button>
      
      {results && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">Total Scenes</p>
              <p className="text-2xl font-bold text-white">{results.total_scenes}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">VFX Scenes</p>
              <p className="text-2xl font-bold text-pink-400">{results.vfx_scenes_count}</p>
            </div>
          </div>
          
          {/* Total Cost */}
          {results.estimated_total_cost > 0 && (
            <div className="bg-gradient-to-r from-pink-900 to-purple-900 rounded-lg p-4">
              <div className="text-center">
                <p className="text-gray-300 text-sm">Estimated VFX Cost</p>
                <p className="text-3xl font-bold text-white">{formatCurrency(results.estimated_total_cost)}</p>
              </div>
            </div>
          )}
          
          {/* VFX Scenes List */}
          {results.vfx_scenes && results.vfx_scenes.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">🎬 VFX Scenes</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {results.vfx_scenes.map((scene: any, i: number) => (
                  <div key={i} className="bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                    <div>
                      <p className="text-purple-400 font-medium">Scene {scene.scene_number}</p>
                      <p className="text-gray-400 text-sm">{scene.location}</p>
                    </div>
                    <div className="text-right">
                      <p className={`capitalize ${getComplexityColor(scene.complexity)}`}>
                        {scene.complexity}
                      </p>
                      <p className="text-xs text-gray-500">{scene.vfx_type}</p>
                      <p className="text-xs text-pink-400">{formatCurrency(scene.estimated_cost)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Recommendations */}
          {results.recommendations && (
            <div className="bg-purple-900/30 rounded-lg p-4">
              <h4 className="text-purple-400 font-semibold mb-2">💡 Recommendations</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                {results.recommendations.map((rec: string, i: number) => (
                  <li key={i}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      
      {(!results && !loading) && (
        <div className="text-center text-gray-500 py-8">
          <p className="text-4xl mb-2">✨</p>
          <p>Analyze scenes for VFX requirements</p>
        </div>
      )}
    </motion.div>
  );
}
