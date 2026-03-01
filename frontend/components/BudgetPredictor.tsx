'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface BudgetPredictorProps {
  scenes?: any[];
  genre?: string;
}

export default function BudgetPredictor({ scenes = [], genre = 'drama' }: BudgetPredictorProps) {
  const [duration, setDuration] = useState(150);
  const [selectedGenre, setSelectedGenre] = useState(genre);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/predict-budget', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenes, duration, genre: selectedGenre }),
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

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700"
    >
      <h3 className="text-xl font-bold text-white mb-4">💰 AI Budget Predictor</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <label className="text-gray-400 text-sm">Duration (minutes)</label>
          <input
            type="number"
            value={duration}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full bg-gray-700 text-white rounded-lg p-2 mt-1"
          />
        </div>
        <div>
          <label className="text-gray-400 text-sm">Genre</label>
          <select 
            value={selectedGenre} 
            onChange={(e) => setSelectedGenre(e.target.value)}
            className="w-full bg-gray-700 text-white rounded-lg p-2 mt-1"
          >
            <option value="drama">Drama</option>
            <option value="action">Action</option>
            <option value="comedy">Comedy</option>
            <option value="thriller">Thriller</option>
            <option value="romance">Romance</option>
            <option value="horror">Horror</option>
            <option value="historical">Historical</option>
          </select>
        </div>
      </div>
      
      <button
        onClick={analyze}
        disabled={loading}
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg disabled:opacity-50 w-full"
      >
        {loading ? 'Calculating...' : 'Predict Budget'}
      </button>
      
      {results && (
        <div className="mt-6 space-y-4">
          <div className="bg-gradient-to-r from-green-900 to-green-800 rounded-lg p-4">
            <div className="text-center">
              <p className="text-gray-300 text-sm">Estimated Total Budget</p>
              <p className="text-3xl font-bold text-white">{formatCurrency(results.estimated_total)}</p>
              <p className="text-xs text-gray-400 mt-1">Confidence: {results.confidence}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gray-900 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Per Scene</p>
              <p className="text-white font-semibold">{formatCurrency(results.per_scene)}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-3">
              <p className="text-gray-400 text-xs">Per Minute</p>
              <p className="text-white font-semibold">{formatCurrency(results.per_minute)}</p>
            </div>
          </div>
          
          {results.breakdown && (
            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-3">Budget Breakdown</h4>
              {Object.entries(results.breakdown).map(([key, val]: [string, any]) => (
                <div key={key} className="mb-3">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400 capitalize">{key.replace('_', ' ')}</span>
                    <span className="text-white">{formatCurrency(val.amount)}</span>
                  </div>
                  <div className="text-xs text-gray-500">{val.items.join(', ')}</div>
                </div>
              ))}
            </div>
          )}
          
          {results.recommendations && (
            <div className="bg-blue-900/30 rounded-lg p-4">
              <h4 className="text-blue-400 font-semibold mb-2">💡 Recommendations</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                {results.recommendations.map((rec: string, i: number) => (
                  <li key={i}>• {rec}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
