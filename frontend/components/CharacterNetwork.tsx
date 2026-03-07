'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface CharacterNetworkProps {
  scenes?: any[];
  characters?: any[];
}

export default function CharacterNetwork({ scenes = [], characters = [] }: CharacterNetworkProps) {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load demo data if no scenes provided
  useEffect(() => {
    if (scenes.length === 0 && !results) {
      loadDemoData();
    }
  }, []);

  const loadDemoData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/character-network', {
        method: 'GET',
      });
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        setError('Failed to load demo data');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to analyze characters');
    }
    setLoading(false);
  };

  const analyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/character-network', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes, characters }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to analyze characters');
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700"
    >
      <h3 className="text-xl font-bold text-white mb-4">🔗 Character Network Analysis</h3>
      {results?.demo && (
        <div className="mb-3 px-3 py-1.5 bg-amber-500/20 text-amber-400 text-xs rounded-lg inline-block">
          Demo Data - Upload a script for real analysis
        </div>
      )}
      
      <button
        onClick={analyze}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 w-full mb-4"
      >
        {loading ? 'Analyzing...' : scenes.length > 0 ? 'Generate Character Network' : 'Load Demo Data'}
      </button>

      {error && (
        <div className="mb-4 px-3 py-2 bg-red-500/20 text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}
      
      {results && (
        <div className="space-y-4">
          {/* Central Characters */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">⭐ Central Characters</h4>
            <div className="space-y-2">
              {results.central_characters?.map((char: any, i: number) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '  '}
                    </span>
                    <span className="text-white">{char.label}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-purple-400">{char.scene_count} scenes</span>
                    <span className="text-gray-500 text-sm ml-2">({char.screen_time} min)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Network Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">Total Characters</p>
              <p className="text-2xl font-bold text-white">{results.network?.nodes?.length || 0}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3 text-center">
              <p className="text-gray-400 text-xs">Relationships</p>
              <p className="text-2xl font-bold text-purple-400">{results.total_relationships}</p>
            </div>
          </div>
          
          {/* Insights */}
          {results.insights && (
            <div className="bg-green-900/30 rounded-lg p-4">
              <h4 className="text-green-400 font-semibold mb-2">💡 Insights</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                {results.insights.map((insight: string, i: number) => (
                  <li key={i}>• {insight}</li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Network Visualization (Simplified) */}
          {results.network?.edges?.length > 0 && (
            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Character Relationships</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {results.network.edges.slice(0, 10).map((edge: any, i: number) => (
                  <div key={i} className="flex items-center justify-between text-sm">
                    <span className="text-cyan-400">{edge.from}</span>
                    <span className="text-gray-500">↔</span>
                    <span className="text-cyan-400">{edge.to}</span>
                    <span className="text-gray-400 ml-auto">{edge.shared_scenes} scenes</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {(!results && !loading) && (
        <div className="text-center text-gray-500 py-8">
          <p>Click "Generate Character Network" to analyze</p>
          <p className="text-sm">Requires scenes with character data</p>
        </div>
      )}
    </motion.div>
  );
}
