'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

interface WeatherScheduleProps {
  schedule?: any[];
}

export default function WeatherSchedule({ schedule = [] }: WeatherScheduleProps) {
  const [location, setLocation] = useState('Chennai');
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-load demo data on mount
  useEffect(() => {
    loadDemoData();
  }, []);

  const loadDemoData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/ai/weather-schedule?location=${encodeURIComponent(location)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data);
      } else {
        setError('Failed to load weather data');
      }
    } catch (err) {
      console.error(err);
      setError('Failed to load weather data');
    }
    setLoading(false);
  };

  const analyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/ai/weather-schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ schedule, location }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data);
      }
    } catch (err) {
      console.error(err);
      setError('Failed to analyze schedule');
    }
    setLoading(false);
  };

  const getWeatherEmoji = (condition: string) => {
    const c = condition.toLowerCase();
    if (c.includes('sunny') || c.includes('clear')) return '☀️';
    if (c.includes('cloud')) return '☁️';
    if (c.includes('rain')) return '🌧️';
    if (c.includes('partly')) return '⛅';
    return '🌤️';
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-800 rounded-xl p-6 border border-gray-700"
    >
      <h3 className="text-xl font-bold text-white mb-4">🌤️ Weather-Aware Scheduling</h3>
      {results?.demo && (
        <div className="mb-3 px-3 py-1.5 bg-amber-500/20 text-amber-400 text-xs rounded-lg inline-block">
          Demo Data - Connect schedule for real recommendations
        </div>
      )}
      
      {error && (
        <div className="mb-3 px-3 py-2 bg-red-500/20 text-red-400 text-sm rounded-lg">
          {error}
        </div>
      )}
      
      <div className="flex gap-3 mb-4">
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Location"
          className="flex-1 bg-gray-700 text-white rounded-lg p-2"
        />
        <button
          onClick={analyze}
          disabled={loading}
          className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
        >
          {loading ? 'Loading...' : 'Get Forecast'}
        </button>
      </div>
      
      {results && (
        <div className="space-y-4">
          {/* Best Days */}
          {results.best_days && (
            <div className="bg-green-900/30 rounded-lg p-4">
              <h4 className="text-green-400 font-semibold mb-2">✅ Best Days for Outdoor Shooting</h4>
              <div className="flex flex-wrap gap-2">
                {results.best_days.map((day: string, i: number) => (
                  <span key={i} className="bg-green-800 text-green-200 px-3 py-1 rounded-full text-sm">
                    {day}
                  </span>
                ))}
              </div>
            </div>
          )}
          
          {/* 14-Day Forecast */}
          <div className="bg-gray-900 rounded-lg p-4">
            <h4 className="text-white font-semibold mb-3">📅 14-Day Forecast</h4>
            <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {results.forecast?.map((day: any, i: number) => (
                <div key={i} className="bg-gray-800 rounded-lg p-2 flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-xs">{day.date?.slice(5) || day.dayName}</p>
                    <p className="text-lg">{getWeatherEmoji(day.condition)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white text-sm">{day.tempHigh}°/{day.tempLow}°</p>
                    <p className={`text-xs ${day.rainChance > 30 ? 'text-red-400' : 'text-green-400'}`}>
                      Rain: {day.rainChance}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Recommendations */}
          {results.recommendations && results.recommendations.length > 0 && (
            <div className="bg-orange-900/30 rounded-lg p-4">
              <h4 className="text-orange-400 font-semibold mb-2">⚠️ Schedule Recommendations</h4>
              <div className="space-y-2">
                {results.recommendations.map((rec: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <span className="text-orange-400">{rec.type === 'indoor_shoot' ? '🏠' : '🌅'}</span>
                    <div>
                      <span className="text-white">{rec.date}</span>
                      <p className="text-gray-400">{rec.reason}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      
      {(!results && !loading) && (
        <div className="text-center text-gray-500 py-8">
          <p className="text-4xl mb-2">🌧️</p>
          <p>Enter location and get weather-aware scheduling</p>
        </div>
      )}
    </motion.div>
  );
}
