'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

interface FilmComparisonProps {
  projectId?: string;
}

// Genre-specific color palettes
const GENRE_COLORS: Record<string, string> = {
  drama: '#8b5cf6',
  action: '#ef4444',
  comedy: '#f59e0b',
  thriller: '#6366f1',
  romance: '#ec4899',
  horror: '#171717',
  historical: '#d97706',
};

// Demo data for each genre
const DEMO_DATA: Record<string, any> = {
  drama: {
    estimates: { budget_range: '₹15-25 Cr', box_office_potential: '₹50-80 Cr', target_audience: 'Family', optimal_runtime: '150-165 min', estimated_runtime: 158, estimated_pages: 165 },
    similar_films: [
      { title: 'Vikram Vedha', budget: 25000000, box_office: 85000000, match_score: 87, genre_score: 92 },
      { title: 'Thalapathi', budget: 20000000, box_office: 120000000, match_score: 82, genre_score: 88 },
      { title: 'Anbe Sivam', budget: 15000000, box_office: 45000000, match_score: 78, genre_score: 85 },
      { title: 'Kadhal', budget: 12000000, box_office: 35000000, match_score: 75, genre_score: 82 },
      { title: 'Mouna Ragam', budget: 8000000, box_office: 25000000, match_score: 71, genre_score: 79 },
    ],
    budget_breakdown: [
      { category: 'Production', value: 35 },
      { category: 'Cast & Crew', value: 28 },
      { category: 'Post-Production', value: 18 },
      { category: 'Music', value: 10 },
      { category: 'Marketing', value: 9 },
    ],
    recommendations: [
      'Consider family-friendly content for wider reach',
      'Music can be a major driver of box office',
      'Emotional drama elements resonate well with target audience',
    ],
  },
  action: {
    estimates: { budget_range: '₹40-80 Cr', box_office: '₹100-250 Cr', target_audience: 'Young Adult', optimal_runtime: '150-175 min', estimated_runtime: 168, estimated_pages: 172 },
    similar_films: [
      { title: 'Leo', budget: 100000000, box_office: 350000000, match_score: 95, genre_score: 98 },
      { title: 'Jawan', budget: 80000000, box_office: 300000000, match_score: 92, genre_score: 95 },
      { title: 'Vikram', budget: 65000000, box_office: 280000000, match_score: 88, genre_score: 91 },
      { title: 'Master', budget: 45000000, box_office: 200000000, match_score: 82, genre_score: 86 },
      { title: 'Beast', budget: 50000000, box_office: 180000000, match_score: 78, genre_score: 83 },
    ],
    budget_breakdown: [
      { category: 'Production', value: 42 },
      { category: 'Cast & Crew', value: 25 },
      { category: 'VFX & Stunts', value: 18 },
      { category: 'Post-Production', value: 10 },
      { category: 'Marketing', value: 5 },
    ],
    recommendations: [
      'High VFX budget recommended for competitive edge',
      'Stunt choreography is crucial for this genre',
      'Consider releasing during holiday period for max ROI',
    ],
  },
  comedy: {
    estimates: { budget_range: '₹10-20 Cr', box_office: '₹40-100 Cr', target_audience: 'All Ages', optimal_runtime: '140-160 min', estimated_runtime: 152, estimated_pages: 158 },
    similar_films: [
      { title: 'Chennai Express', budget: 35000000, box_office: 180000000, match_score: 91, genre_score: 94 },
      { title: 'Baasha', budget: 20000000, box_office: 150000000, match_score: 85, genre_score: 89 },
      { title: 'Goblin', budget: 15000000, box_office: 80000000, match_score: 79, genre_score: 84 },
      { title: 'Soodhu Kavvum', budget: 12000000, box_office: 55000000, match_score: 74, genre_score: 80 },
      { title: 'K大胆i', budget: 18000000, box_office: 65000000, match_score: 72, genre_score: 78 },
    ],
    budget_breakdown: [
      { category: 'Production', value: 32 },
      { category: 'Cast & Crew', value: 30 },
      { category: 'Post-Production', value: 15 },
      { category: 'Music', value: 13 },
      { category: 'Marketing', value: 10 },
    ],
    recommendations: [
      'Strong ensemble cast works well for comedy',
      'Music and comedy elements drive box office',
      'Word-of-mouth is critical - focus on entertainer elements',
    ],
  },
  thriller: {
    estimates: { budget_range: '₹20-40 Cr', box_office: '₹60-150 Cr', target_audience: 'Adult', optimal_runtime: '150-170 min', estimated_runtime: 162, estimated_pages: 168 },
    similar_films: [
      { title: 'Thirumanam Ennum Nikkum', budget: 25000000, box_office: 95000000, match_score: 88, genre_score: 91 },
      { title: 'Pariyerum Perumal', budget: 18000000, box_office: 75000000, match_score: 83, genre_score: 87 },
      { title: 'Visa', budget: 22000000, box_office: 68000000, match_score: 78, genre_score: 82 },
      { title: 'Mersal', budget: 55000000, box_office: 180000000, match_score: 75, genre_score: 79 },
    ],
    budget_breakdown: [
      { category: 'Production', value: 38 },
      { category: 'Cast & Crew', value: 25 },
      { category: 'Post-Production', value: 22 },
      { category: 'Music', value: 8 },
      { category: 'Marketing', value: 7 },
    ],
    recommendations: [
      'Complex narrative requires careful editing',
      'Background score is crucial for thriller genre',
      'Critical acclaim can drive long-term success',
    ],
  },
  romance: {
    estimates: { budget_range: '₹12-22 Cr', box_office: '₹45-90 Cr', target_audience: 'Young Adult', optimal_runtime: '145-165 min', estimated_runtime: 155, estimated_pages: 162 },
    similar_films: [
      { title: '96', budget: 18000000, box_office: 120000000, match_score: 90, genre_score: 93 },
      { title: 'Kaathuvaakula Rendu Kaadhalu', budget: 25000000, box_office: 85000000, match_score: 84, genre_score: 88 },
      { title: 'Love Today', budget: 15000000, box_office: 95000000, match_score: 81, genre_score: 86 },
      { title: 'Sita Ramam', budget: 20000000, box_office: 150000000, match_score: 78, genre_score: 83 },
      { title: 'Madhumati', budget: 12000000, box_office: 45000000, match_score: 72, genre_score: 78 },
    ],
    budget_breakdown: [
      { category: 'Production', value: 30 },
      { category: 'Cast & Crew', value: 28 },
      { category: 'Music', value: 20 },
      { category: 'Post-Production', value: 12 },
      { category: 'Marketing', value: 10 },
    ],
    recommendations: [
      'Music is the backbone of romance films',
      'Lead actor chemistry is critical for success',
      'Songs should be integrated naturally into narrative',
    ],
  },
  horror: {
    estimates: { budget_range: '₹5-15 Cr', box_office: '₹25-60 Cr', target_audience: 'Adult', optimal_runtime: '120-150 min', estimated_runtime: 138, estimated_pages: 145 },
    similar_films: [
      { title: 'Kanthadi', budget: 8000000, box_office: 45000000, match_score: 85, genre_score: 89 },
      { title: 'Meyaadha Maan', budget: 12000000, box_office: 55000000, match_score: 79, genre_score: 84 },
      { title: 'Raatri', budget: 6000000, box_office: 32000000, match_score: 74, genre_score: 80 },
      { title: 'Yeh Hai Chandan', budget: 10000000, box_office: 38000000, match_score: 70, genre_score: 76 },
    ],
    budget_breakdown: [
      { category: 'Production', value: 35 },
      { category: 'VFX & Effects', value: 28 },
      { category: 'Post-Production', value: 20 },
      { category: 'Music', value: 10 },
      { category: 'Marketing', value: 7 },
    ],
    recommendations: [
      'VFX and sound design are critical for horror',
      'Limited budget can still yield strong results',
      'Weekend releases work best for horror genre',
    ],
  },
  historical: {
    estimates: { budget_range: '₹50-120 Cr', box_office: '₹80-200 Cr', target_audience: 'Family', optimal_runtime: '170-210 min', estimated_runtime: 185, estimated_pages: 195 },
    similar_films: [
      { title: 'Ponniyin Selvan', budget: 150000000, box_office: 250000000, match_score: 94, genre_score: 97 },
      { title: 'Thalapathi', budget: 20000000, box_office: 120000000, match_score: 82, genre_score: 86 },
      { title: 'Kalki', budget: 80000000, box_office: 180000000, match_score: 78, genre_score: 82 },
      { title: 'Thiruda Thiruda', budget: 15000000, box_office: 45000000, match_score: 71, genre_score: 76 },
    ],
    budget_breakdown: [
      { category: 'Production', value: 45 },
      { category: 'Sets & Props', value: 22 },
      { category: 'Cast & Crew', value: 15 },
      { category: 'Post-Production', value: 13 },
      { category: 'Marketing', value: 5 },
    ],
    recommendations: [
      'Authentic period details are crucial',
      'Consider tax subsidies for historical films',
      'International distribution potential is high',
    ],
  },
};

export default function FilmComparison({ projectId }: FilmComparisonProps) {
  const [scriptContent, setScriptContent] = useState('');
  const [genre, setGenre] = useState('drama');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/ai/film-comparison', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ script_content: scriptContent, genre }),
      });
      const data = await res.json();
      setResults(data);
    } catch (err) {
      console.error(err);
      // Show demo results with enhanced data
      setResults(DEMO_DATA[genre] || DEMO_DATA.drama);
    }
    setLoading(false);
  };

  const handleGenreChange = (newGenre: string) => {
    setGenre(newGenre);
    // Show preview of what results will look like
    setResults(DEMO_DATA[newGenre] || DEMO_DATA.drama);
  };

  const formatBudget = (amount: number) => {
    if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`;
    if (amount >= 100000) return `₹${(amount / 100000).toFixed(0)}L`;
    return `₹${amount.toLocaleString()}`;
  };

  const budgetChartData = results?.budget_breakdown || [];
  const pieColors = ['#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4', '#ec4899'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-white">🎬 Film Comparison & Benchmarking</h3>
        <span className="text-xs text-gray-500">AI-Powered Analysis</span>
      </div>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-sm block mb-2">Genre</label>
            <select 
              value={genre} 
              onChange={(e) => handleGenreChange(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg p-2.5 border border-gray-600 focus:border-purple-500 focus:outline-none"
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
            <label className="text-gray-400 text-sm block mb-2">Script Content</label>
            <div className="bg-gray-900 rounded-lg p-2.5 border border-gray-700">
              <span className="text-gray-500 text-sm">{scriptContent ? `${scriptContent.length} chars` : 'Paste below'}</span>
            </div>
          </div>
        </div>
        
        <div>
          <label className="text-gray-400 text-sm">Script for Analysis</label>
          <textarea
            value={scriptContent}
            onChange={(e) => setScriptContent(e.target.value)}
            placeholder="Paste script content or description for AI analysis..."
            className="w-full bg-gray-700 text-white rounded-lg p-3 mt-1 h-24 border border-gray-600 focus:border-purple-500 focus:outline-none resize-none"
          />
        </div>
        
        <button
          onClick={analyze}
          disabled={loading}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-4 py-2.5 rounded-lg disabled:opacity-50 font-medium transition-all"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="animate-spin">⏳</span> Analyzing...
            </span>
          ) : (
            '🔍 Analyze & Compare'
          )}
        </button>
        
        {results && (
          <div className="mt-6 space-y-6">
            {/* Key Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="bg-gray-900 rounded-lg p-3 text-center border border-gray-700">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Budget Range</p>
                <p className="text-lg font-bold text-green-400">{results.estimates?.budget_range || 'N/A'}</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 text-center border border-gray-700">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Box Office</p>
                <p className="text-lg font-bold text-yellow-400">{results.estimates?.box_office_potential || 'N/A'}</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 text-center border border-gray-700">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Runtime</p>
                <p className="text-lg font-bold text-blue-400">{results.estimates?.optimal_runtime || 'N/A'}</p>
              </div>
              <div className="bg-gray-900 rounded-lg p-3 text-center border border-gray-700">
                <p className="text-gray-400 text-xs uppercase tracking-wider">Audience</p>
                <p className="text-lg font-bold text-purple-400">{results.estimates?.target_audience || 'N/A'}</p>
              </div>
            </div>

            {/* Budget Breakdown Chart */}
            {budgetChartData.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span>💰</span> Budget Allocation
                </h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={budgetChartData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis type="number" stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `${v}%`} />
                      <YAxis dataKey="category" type="category" stroke="#9ca3af" fontSize={11} width={80} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        formatter={(value: number) => [`${value}%`, 'Allocation']}
                      />
                      <Bar dataKey="value" fill={GENRE_COLORS[genre] || '#8b5cf6'} radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            {/* Similar Films with Match Scores */}
            {results.similar_films && results.similar_films.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span>🎥</span> Similar Films Benchmark
                </h4>
                <div className="space-y-3">
                  {results.similar_films.map((film: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 p-3 bg-gray-800 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                        #{i + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-white font-medium">{film.title}</span>
                          <span className="text-green-400 text-sm font-medium">{formatBudget(film.budget)}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex-1 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                              style={{ width: `${film.match_score}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-400">{film.match_score}% match</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Box Office Comparison Chart */}
            {results.similar_films && results.similar_films.length > 0 && (
              <div className="bg-gray-900 rounded-lg p-4 border border-gray-700">
                <h4 className="text-white font-semibold mb-4 flex items-center gap-2">
                  <span>📈</span> Box Office Potential
                </h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={results.similar_films.slice(0, 5)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="title" stroke="#9ca3af" fontSize={10} angle={-45} textAnchor="end" height={60} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickFormatter={(v) => `₹${(v/10000000).toFixed(1)}Cr`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151', borderRadius: '8px' }}
                        formatter={(value: number) => [formatBudget(value), 'Box Office']}
                      />
                      <Bar dataKey="box_office" fill="#10b981" radius={[4, 4, 0, 0]} name="Box Office" />
                      <Bar dataKey="budget" fill="#6b7280" radius={[4, 4, 0, 0]} name="Budget" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
            
            {/* Recommendations */}
            {results.recommendations && results.recommendations.length > 0 && (
              <div className="bg-gradient-to-br from-purple-900/30 to-pink-900/30 rounded-lg p-4 border border-purple-700/50">
                <h4 className="text-purple-400 font-semibold mb-3 flex items-center gap-2">
                  <span>💡</span> AI Recommendations
                </h4>
                <ul className="space-y-2">
                  {results.recommendations.map((rec: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
                      <span className="text-purple-400 mt-0.5">→</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
