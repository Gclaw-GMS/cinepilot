'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';

interface FilmComparisonProps {
  projectId?: string;
}

export default function FilmComparison({ projectId }: FilmComparisonProps) {
  const [scriptContent, setScriptContent] = useState('');
  const [genre, setGenre] = useState('drama');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/ai/film-comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_content: scriptContent, genre }),
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700"
    >
      <h3 className="text-xl font-bold text-white mb-4">🎬 Film Comparison & Benchmarking</h3>
      
      <div className="space-y-4">
        <div>
          <label className="text-gray-400 text-sm">Genre</label>
          <select 
            value={genre} 
            onChange={(e) => setGenre(e.target.value)}
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
        
        <div>
          <label className="text-gray-400 text-sm">Script Content (paste for analysis)</label>
          <textarea
            value={scriptContent}
            onChange={(e) => setScriptContent(e.target.value)}
            placeholder="Paste script content here to compare with similar films..."
            className="w-full bg-gray-700 text-white rounded-lg p-3 mt-1 h-32"
          />
        </div>
        
        <button
          onClick={analyze}
          disabled={loading || !scriptContent}
          className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Analyzing...' : 'Compare with Similar Films'}
        </button>
        
        {results && (
          <div className="mt-6 space-y-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <h4 className="text-white font-semibold mb-2">📊 Estimates</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-400">Runtime:</span>
                  <span className="text-white ml-2">{results.estimated_runtime} min</span>
                </div>
                <div>
                  <span className="text-gray-400">Pages:</span>
                  <span className="text-white ml-2">{results.estimated_pages}</span>
                </div>
              </div>
            </div>
            
            {results.similar_films && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">🎥 Similar Films</h4>
                <div className="space-y-2">
                  {results.similar_films.map((film: any, i: number) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-purple-400">{film.title}</span>
                      <span className="text-gray-400">₹{film.budget.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {results.budget_comparison && (
              <div className="bg-gray-900 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-2">💰 Budget Comparison</h4>
                <div className="text-sm space-y-1">
                  <p><span className="text-gray-400">Estimated:</span> <span className="text-green-400">₹{results.budget_comparison.estimated_budget.toLocaleString()}</span></p>
                  <p><span className="text-gray-400">Similar Films Avg:</span> <span className="text-yellow-400">₹{results.budget_comparison.similar_films_avg.toLocaleString()}</span></p>
                  <p className="text-gray-400 mt-2">{results.budget_comparison.recommendation}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
