// CinePilot - Film Comparison & Benchmarking
// Compare script with similar films and get budget/runtime estimates

'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  Film, 
  Loader2, 
  AlertCircle, 
  CheckCircle, 
  TrendingUp, 
  DollarSign, 
  Clock,
  Star,
  BarChart3,
  Target,
  Sparkles,
  RefreshCw,
  Clapperboard,
  Tv
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,  ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Legend
} from 'recharts'

interface BenchmarkFilm {
  title: string
  year: number
  genre: string
  budget: number
  runtime: number
  boxOffice?: number
  rating: number
}

interface FilmComparisonProps {
  projectId?: string
}

// Genre-specific benchmark films database
const BENCHMARK_DATABASE: Record<string, BenchmarkFilm[]> = {
  drama: [
    { title: 'Vikram Vedha', year: 2017, genre: 'Drama', budget: 25000000, runtime: 142, boxOffice: 65000000, rating: 8.2 },
    { title: 'Super Deluxe', year: 2019, genre: 'Drama', budget: 35000000, runtime: 176, boxOffice: 85000000, rating: 8.4 },
    { title: 'Karnan', year: 2021, genre: 'Drama', budget: 40000000, runtime: 170, boxOffice: 120000000, rating: 8.3 },
  ],
  action: [
    { title: 'Master', year: 2021, genre: 'Action', budget: 125000000, runtime: 180, boxOffice: 210000000, rating: 7.8 },
    { title: 'Beast', year: 2022, genre: 'Action', budget: 150000000, runtime: 156, boxOffice: 180000000, rating: 6.2 },
    { title: 'Jawan', year: 2023, genre: 'Action', budget: 300000000, runtime: 164, boxOffice: 650000000, rating: 7.1 },
  ],
  comedy: [
    { title: 'Soodhu Kavvum', year: 2013, genre: 'Comedy', budget: 8000000, runtime: 120, boxOffice: 45000000, rating: 8.1 },
    { title: 'Pyaar Ka Punchnama 2', year: 2015, genre: 'Comedy', budget: 12000000, runtime: 137, boxOffice: 95000000, rating: 8.0 },
    { title: 'Love Today', year: 2022, genre: 'Comedy', budget: 25000000, runtime: 153, boxOffice: 90000000, rating: 7.6 },
  ],
  thriller: [
    { title: 'Raman Raghav 2.0', year: 2016, genre: 'Thriller', budget: 18000000, runtime: 133, boxOffice: 32000000, rating: 7.9 },
    { title: 'Mersal', year: 2017, genre: 'Thriller', budget: 120000000, runtime: 182, boxOffice: 250000000, rating: 7.8 },
    { title: 'Vikram', year: 2022, genre: 'Thriller', budget: 150000000, runtime: 175, boxOffice: 420000000, rating: 8.3 },
  ],
  romance: [
    { title: '96', year: 2018, genre: 'Romance', budget: 25000000, runtime: 158, boxOffice: 120000000, rating: 8.6 },
    { title: 'Kaathiruppen', year: 2023, genre: 'Romance', budget: 30000000, runtime: 165, boxOffice: 85000000, rating: 7.8 },
    { title: 'Sita Ramam', year: 2022, genre: 'Romance', budget: 45000000, runtime: 163, boxOffice: 180000000, rating: 8.7 },
  ],
  horror: [
    { title: 'Muni 2: Kanchana', year: 2011, genre: 'Horror', budget: 12000000, runtime: 137, boxOffice: 85000000, rating: 7.3 },
    { title: 'Raaz Reboot', year: 2016, genre: 'Horror', budget: 25000000, runtime: 128, boxOffice: 42000000, rating: 5.4 },
    { title: 'Tumbbad', year: 2018, genre: 'Horror', budget: 15000000, runtime: 104, boxOffice: 85000000, rating: 8.3 },
  ],
  historical: [
    { title: 'Ponniyin Selvan 1', year: 2022, genre: 'Historical', budget: 500000000, runtime: 167, boxOffice: 280000000, rating: 7.6 },
    { title: 'Thugs of Hindostan', year: 2018, genre: 'Historical', budget: 200000000, runtime: 164, boxOffice: 350000000, rating: 5.8 },
    { title: 'Baahubali 2', year: 2017, genre: 'Historical', budget: 250000000, runtime: 167, boxOffice: 2100000000, rating: 8.3 },
  ],
}

const GENRE_COLORS: Record<string, string> = {
  drama: '#8b5cf6',
  action: '#ef4444',
  comedy: '#f59e0b',
  thriller: '#06b6d4',
  romance: '#ec4899',
  horror: '#6366f1',
  historical: '#10b981',
}

const GENRES = [
  { id: 'drama', label: 'Drama', icon: Film },
  { id: 'action', label: 'Action', icon: Target },
  { id: 'comedy', label: 'Comedy', icon: Star },
  { id: 'thriller', label: 'Thriller', icon: TrendingUp },
  { id: 'romance', label: 'Romance', icon: Film },
  { id: 'horror', label: 'Horror', icon: Film },
  { id: 'historical', label: 'Historical', icon: Clapperboard },
]

function estimateFromText(text: string, genre: string) {
  // Simple estimation based on text analysis
  const lines = text.split('\n').filter(l => l.trim())
  const wordCount = text.split(/\s+/).length
  const pageCount = Math.ceil(lines.length / 10) // ~10 lines per page
  
  // Estimate based on genre
  const avgWordsPerPage = 250
  const estimatedPages = Math.max(15, Math.min(200, Math.round(wordCount / avgWordsPerPage)))
  const estimatedRuntime = Math.round(estimatedPages * 1.1) // ~1.1 min per page
  const estimatedBudget = estimateBudget(genre, estimatedPages, lines.length)
  
  return {
    estimated_pages: estimatedPages,
    estimated_runtime: estimatedRuntime,
    estimated_budget: estimatedBudget,
    word_count: wordCount,
    line_count: lines.length,
    scene_count: Math.max(1, Math.round((lines.filter(l => l.match(/^(INT\.|EXT\.)/i)).length || Math.ceil(lines.length / 15)))),
  }
}

function estimateBudget(genre: string, pages: number, sceneCount: number): number {
  const baseBudget: Record<string, number> = {
    drama: 15000000,
    action: 80000000,
    comedy: 10000000,
    thriller: 20000000,
    romance: 12000000,
    horror: 8000000,
    historical: 150000000,
  }
  
  const base = baseBudget[genre] || 20000000
  const pageMultiplier = Math.max(0.5, Math.min(2, pages / 120))
  const sceneMultiplier = Math.max(0.7, Math.min(1.5, sceneCount / 50))
  
  return Math.round(base * pageMultiplier * sceneMultiplier)
}

function analyzeGenre(text: string, genre: string) {
  // Count indicators for genre-specific elements
  const upperText = text.toUpperCase()
  
  const genreIndicators: Record<string, string[]> = {
    drama: ['CRYING', 'EMOTIONAL', 'SAD', 'HAPPY', 'FAMILY'],
    action: ['EXPLOSION', 'CHASE', 'FIGHT', 'GUN', 'SHOOT'],
    comedy: ['LAUGHING', 'JOKE', 'FUNNY', 'HILARIOUS'],
    thriller: ['KILL', 'DEAD', 'MURDER', 'SCREAM', 'RUN'],
    romance: ['KISS', 'LOVE', 'HUG', 'HEART', 'DARLING'],
    horror: ['SCARY', 'BLOOD', 'GHOST', 'DEAD', 'NIGHTMARE'],
    historical: ['KING', 'QUEEN', 'KINGDOM', 'ANCIENT', 'WAR'],
  }
  
  const indicators = genreIndicators[genre] || []
  let matchScore = 0
  indicators.forEach(ind => {
    if (upperText.includes(ind)) matchScore += 1
  })
  
  return {
    genre_match_score: Math.min(100, Math.round((matchScore / indicators.length) * 100)),
    primary_genre: genre,
    confidence: Math.min(95, 50 + matchScore * 5),
  }
}

function generateComparison(text: string, genre: string) {
  const estimates = estimateFromText(text, genre)
  const benchmarks = BENCHMARK_DATABASE[genre] || BENCHMARK_DATABASE.drama
  const genreAnalysis = analyzeGenre(text, genre)
  
  // Calculate similarity scores
  const similarFilms = benchmarks.map(film => ({
    title: film.title,
    year: film.year,
    genre: film.genre,
    budget: film.budget,
    runtime: film.runtime,
    boxOffice: film.boxOffice,
    rating: film.rating,
    similarity: calculateSimilarity(estimates, film),
  })).sort((a, b) => b.similarity - a.similarity).slice(0, 4)
  
  const avgBudget = benchmarks.reduce((sum, f) => sum + f.budget, 0) / benchmarks.length
  const avgRuntime = benchmarks.reduce((sum, f) => sum + f.runtime, 0) / benchmarks.length
  
  const budgetComparison = {
    estimated_budget: estimates.estimated_budget,
    similar_films_avg: Math.round(avgBudget),
    difference_pct: Math.round(((estimates.estimated_budget - avgBudget) / avgBudget) * 100),
    recommendation: estimates.estimated_budget < avgBudget 
      ? `Budget is ${Math.abs(Math.round(((avgBudget - estimates.estimated_budget) / avgBudget) * 100))}% below average for this genre - achievable production value`
      : estimates.estimated_budget > avgBudget * 1.3
        ? 'Budget is above genre average - ensure脚本 has scale to justify'
        : 'Budget is within typical range for this genre',
  }
  
  const runtimeComparison = {
    estimated_runtime: estimates.estimated_runtime,
    similar_films_avg: Math.round(avgRuntime),
    recommendation: estimates.estimated_runtime < avgRuntime * 0.8
      ? 'Shorter than typical - good for theatrical release'
      : estimates.estimated_runtime > avgRuntime * 1.2
        ? 'Longer than typical - consider pacing for modern audiences'
        : 'Runtime is within genre norms',
  }
  
  // Budget breakdown estimate
  const breakdown = {
    production: { amount: Math.round(estimates.estimated_budget * 0.45), percentage: 45 },
    talent: { amount: Math.round(estimates.estimated_budget * 0.20), percentage: 20 },
    postProduction: { amount: Math.round(estimates.estimated_budget * 0.15), percentage: 15 },
    marketing: { amount: Math.round(estimates.estimated_budget * 0.12), percentage: 12 },
    contingency: { amount: Math.round(estimates.estimated_budget * 0.08), percentage: 8 },
  }
  
  // ROI prediction
  const roiPrediction = {
    optimistic: Math.round(estimates.estimated_budget * 2.5),
    realistic: Math.round(estimates.estimated_budget * 1.3),
    conservative: Math.round(estimates.estimated_budget * 0.7),
    breakeven: Math.round(estimates.estimated_budget * 1.1),
  }
  
  return {
    estimates,
    genre_analysis: genreAnalysis,
    similar_films: similarFilms,
    budget_comparison: budgetComparison,
    runtime_comparison: runtimeComparison,
    breakdown,
    roi_prediction: roiPrediction,
  }
}

function calculateSimilarity(estimates: { estimated_pages: number; estimated_runtime: number }, film: BenchmarkFilm): number {
  const pageDiff = Math.abs(estimates.estimated_pages - (film.runtime / 1.1)) / 100
  const runtimeDiff = Math.abs(estimates.estimated_runtime - film.runtime) / 150
  return Math.max(0, Math.round((1 - (pageDiff + runtimeDiff) / 2) * 100))
}

function formatCurrency(amount: number): string {
  if (amount >= 100000000) return `₹${(amount / 100000000).toFixed(1)}B`
  if (amount >= 10000000) return `₹${(amount / 10000000).toFixed(1)}Cr`
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`
  return `₹${amount.toLocaleString()}`
}

export default function FilmComparison({ projectId }: FilmComparisonProps) {
  const [scriptContent, setScriptContent] = useState('')
  const [genre, setGenre] = useState('drama')
  const [results, setResults] = useState<ReturnType<typeof generateComparison> | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'overview' | 'budget' | 'similar' | 'roi'>('overview')

  const analyze = async () => {
    if (!scriptContent.trim()) {
      setError('Please enter script content to analyze')
      return
    }
    
    setLoading(true)
    setError(null)
    
    // Simulate API delay for realism
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    try {
      // Use local analysis (could be replaced with AI API call)
      const analysis = generateComparison(scriptContent, genre)
      setResults(analysis)
    } catch (err) {
      console.error('Analysis error:', err)
      setError('Failed to analyze script. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const loadSampleScript = () => {
    const sampleScript = `INT. TEMPLE - DAY

The ancient temple stands tall against the golden sunrise. PRIYA (30s, determined) walks toward the entrance, her eyes reflecting years of struggle and hope.

PRIYA
(softly)
This is where it all began.

She touches the worn stone wall, memories flooding back. Flashcuts of her childhood play like an old film reel.

EXT. CITY STREETS - NIGHT

Rain pours down on the bustling market. People rush past with umbrellas. A CHASE ENSUES - suspects fleeing through narrow alleyways.

Vikram follows, his footsteps echoing. He jumps over crates, slides under hanging clothes.

VIKRAM
(into radio)
Target is heading toward the waterfront!

EXT. BEACH RESORT - SUNSET

Romantic music plays as PRIYA and ARJUN meet at the shoreline. Waves crash gently behind them.

ARJUN
I've waited my whole life for this moment.

They embrace as the sun dips below the horizon, painting the sky in shades of orange and pink.

INT. CHENNAI STUDIO - NIGHT

An EXPLOSION rocks the warehouse. Flames rise. Action choreography as stunt performers leap through fire.

DIRECTOR
(action!)
Cameras roll. This is the climax we've been waiting for.

INT. HERITAGE BUILDING - DAY

A flashback sequence. Young PRIYA stands with her father, learning the values that will guide her journey.

FATHER
Remember, beta - courage is not the absence of fear, but the decision that something else matters more.

INT. COURTROOM - DAY

TENSION MOUNTS as the verdict is read. All characters gathered. This is the culmination of every story thread.

JUDGE
In the matter of...

The gavel strikes. Justice is served.`
    setScriptContent(sampleScript)
    setGenre('drama')
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900 rounded-xl p-6 border border-slate-700"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-purple-600 shadow-lg">
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Film Benchmarking</h3>
            <p className="text-xs text-slate-400">Compare with similar films & estimate metrics</p>
          </div>
        </div>
        {!results && (
          <button
            onClick={loadSampleScript}
            className="text-xs text-violet-400 hover:text-violet-300 underline"
          >
            Load sample
          </button>
        )}
      </div>

      {/* Genre Selector */}
      <div className="mb-4">
        <label className="text-xs text-slate-400 mb-2 block">Select Genre</label>
        <div className="flex flex-wrap gap-2">
          {GENRES.map((g) => (
            <button
              key={g.id}
              onClick={() => setGenre(g.id)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                genre === g.id 
                  ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/25' 
                  : 'bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
              }`}
            >
              <g.icon className="w-3.5 h-3.5 inline-block mr-1.5" />
              {g.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Script Input */}
      <div className="mb-4">
        <label className="text-xs text-slate-400 mb-2 block">Script Content</label>
        <textarea
          value={scriptContent}
          onChange={(e) => setScriptContent(e.target.value)}
          placeholder="Paste your script or scene descriptions here for analysis..."
          className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-slate-200 text-sm h-40 resize-none placeholder-slate-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/30 transition-all"
        />
        <div className="flex justify-between mt-1.5">
          <span className="text-xs text-slate-500">
            {scriptContent.split(/\s+/).filter(Boolean).length} words • {scriptContent.split('\n').filter(Boolean).length} lines
          </span>
          <span className="text-xs text-slate-500">
            {scriptContent ? `${Math.ceil(scriptContent.split(/\s+/).filter(Boolean).length / 250)} pages estimated` : '0 pages'}
          </span>
        </div>
      </div>
        
      {/* Analyze Button */}
      <button
        onClick={analyze}
        disabled={loading || !scriptContent.trim()}
        className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2.5 rounded-lg font-medium flex items-center justify-center gap-2 transition-all"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Analyzing script...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4" />
            Compare & Benchmark
          </>
        )}
      </button>

      {/* Error Display */}
      {error && (
        <div className="mt-4 bg-red-900/20 border border-red-800 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}
      
      {/* Results */}
      {results && (
        <div className="mt-6 space-y-4">
          {/* Tabs */}
          <div className="flex gap-1 bg-slate-800 p-1 rounded-lg">
            {(['overview', 'budget', 'similar', 'roi'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  activeTab === tab 
                    ? 'bg-slate-700 text-white' 
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                {tab === 'overview' && 'Overview'}
                {tab === 'budget' && 'Budget'}
                {tab === 'similar' && 'Similar Films'}
                {tab === 'roi' && 'ROI'}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-slate-800 rounded-lg p-4 text-center">
                  <Clock className="w-5 h-5 text-violet-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{results.estimates.estimated_runtime}</p>
                  <p className="text-xs text-slate-400">minutes</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 text-center">
                  <Film className="w-5 h-5 text-purple-400 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-white">{results.estimates.estimated_pages}</p>
                  <p className="text-xs text-slate-400">pages</p>
                </div>
                <div className="bg-slate-800 rounded-lg p-4 text-center">
                  <DollarSign className="w-5 h-5 text-emerald-400 mx-auto mb-2" />
                  <p className="text-xl font-bold text-emerald-400">{formatCurrency(results.estimates.estimated_budget)}</p>
                  <p className="text-xs text-slate-400">budget</p>
                </div>
              </div>

              {/* Genre Analysis */}
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-violet-400" />
                  Genre Analysis
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Primary Genre</span>
                    <span className="text-white font-medium capitalize">{results.genre_analysis.primary_genre}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Genre Match</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-violet-500 to-purple-500 rounded-full"
                          style={{ width: `${results.genre_analysis.genre_match_score}%` }}
                        />
                      </div>
                      <span className="text-white text-sm">{results.genre_analysis.genre_match_score}%</span>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 text-sm">Confidence</span>
                    <span className="text-slate-300 text-sm">{results.genre_analysis.confidence}%</span>
                  </div>
                </div>
              </div>

              {/* Runtime Comparison */}
              <div className="bg-slate-800 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-400 text-sm">Runtime vs Genre Avg</span>
                  <span className={`text-sm font-medium ${
                    results.runtime_comparison.estimated_runtime <= results.runtime_comparison.similar_films_avg 
                      ? 'text-emerald-400' : 'text-amber-400'
                  }`}>
                    {results.runtime_comparison.estimated_runtime} vs {results.runtime_comparison.similar_films_avg} min
                  </span>
                </div>
                <p className="text-xs text-slate-500">{results.runtime_comparison.recommendation}</p>
              </div>
            </div>
          )}

          {/* Budget Tab */}
          {activeTab === 'budget' && (
            <div className="space-y-4">
              {/* Budget Pie Chart */}
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3">Budget Breakdown</h4>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Production', value: results.breakdown.production.amount },
                          { name: 'Talent', value: results.breakdown.talent.amount },
                          { name: 'Post-Production', value: results.breakdown.postProduction.amount },
                          { name: 'Marketing', value: results.breakdown.marketing.amount },
                          { name: 'Contingency', value: results.breakdown.contingency.amount },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#64748b'].map((color, i) => (
                          <Cell key={i} fill={color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        formatter={(value: number) => formatCurrency(value)}
                      />
                      <Legend 
                        formatter={(value) => <span className="text-slate-300 text-xs">{value}</span>}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Budget Comparison */}
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Budget Comparison
                </h4>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-slate-400">Estimated Budget</span>
                    <span className="text-white font-semibold">{formatCurrency(results.budget_comparison.estimated_budget)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-slate-700">
                    <span className="text-slate-400">Genre Average</span>
                    <span className="text-violet-400 font-medium">{formatCurrency(results.budget_comparison.similar_films_avg)}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-slate-400">vs Average</span>
                    <span className={`font-medium ${
                      results.budget_comparison.difference_pct > 0 ? 'text-amber-400' : 'text-emerald-400'
                    }`}>
                      {results.budget_comparison.difference_pct > 0 ? '+' : ''}{results.budget_comparison.difference_pct}%
                    </span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-3 pt-3 border-t border-slate-700">
                  {results.budget_comparison.recommendation}
                </p>
              </div>
            </div>
          )}

          {/* Similar Films Tab */}
          {activeTab === 'similar' && (
            <div className="space-y-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <Tv className="w-4 h-4 text-purple-400" />
                  Similar Films
                </h4>
                <div className="space-y-3">
                  {results.similar_films.map((film, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-medium">{film.title}</span>
                          <span className="text-slate-500 text-xs">({film.year})</span>
                        </div>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-slate-400">{film.genre}</span>
                          <span className="text-xs text-slate-400">{film.runtime} min</span>
                          <span className="text-xs flex items-center gap-0.5 text-amber-400">
                            <Star className="w-3 h-3 fill-current" />
                            {film.rating}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-emerald-400 font-medium">{formatCurrency(film.budget)}</p>
                        <p className="text-xs text-slate-500">{film.similarity}% match</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ROI Tab */}
          {activeTab === 'roi' && (
            <div className="space-y-4">
              <div className="bg-slate-800 rounded-lg p-4">
                <h4 className="text-white font-semibold mb-3 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                  ROI Prediction
                </h4>
                <div className="space-y-3">
                  {[
                    { label: 'Optimistic', value: results.roi_prediction.optimistic, color: 'text-emerald-400', barColor: 'bg-emerald-500' },
                    { label: 'Realistic', value: results.roi_prediction.realistic, color: 'text-violet-400', barColor: 'bg-violet-500' },
                    { label: 'Conservative', value: results.roi_prediction.conservative, color: 'text-amber-400', barColor: 'bg-amber-500' },
                    { label: 'Breakeven', value: results.roi_prediction.breakeven, color: 'text-slate-400', barColor: 'bg-slate-500' },
                  ].map((scenario, i) => {
                    const maxValue = results.roi_prediction.optimistic
                    const percentage = (scenario.value / maxValue) * 100
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">{scenario.label}</span>
                          <span className={`font-medium ${scenario.color}`}>{formatCurrency(scenario.value)}</span>
                        </div>
                        <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${scenario.barColor} rounded-full`}
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gradient-to-r from-violet-900/50 to-purple-900/50 rounded-lg p-4 border border-violet-800/50">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 mt-0.5" />
                  <div>
                    <p className="text-white font-medium">Analysis Complete</p>
                    <p className="text-xs text-slate-400 mt-1">
                      Based on {results.estimates.scene_count} scenes, {results.estimates.word_count} words across {results.similar_films.length} benchmark films in the {genre} genre.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Empty State */}
      {!results && !loading && !error && (
        <div className="text-center py-8 text-slate-500">
          <Film className="w-12 h-12 mx-auto mb-3 text-slate-600" />
          <p className="text-sm">Enter script content and select a genre to compare</p>
        </div>
      )}
    </motion.div>
  )
}
