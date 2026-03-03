'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  Cloud,
  Sun,
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  MapPin,
  RefreshCw,
  Loader2,
  Eye,
  Sunrise,
  Sunset,
  Camera,
  AlertTriangle,
  CheckCircle,
  Clock,
  Film,
  CloudLightning,
  Snowflake,
  CloudFog,
  Gauge,
  Zap,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';

interface WeatherDay {
  date: string;
  dayName: string;
  condition: string;
  conditionDetailed: string;
  tempHigh: number;
  tempLow: number;
  humidity: number;
  windSpeed: number;
  windGust: number;
  precipitation: number;
  precipitationChance: number;
  icon: string;
  iconCode: number;
  recommendation: string;
  recommendationSeverity: 'green' | 'amber' | 'red';
  shootingNotes: string[];
  bestTimeToShoot: string;
  uvIndex: number;
  visibility: number;
  sunrise: string;
  sunset: string;
  goldenHourMorning: string;
  goldenHourEvening: string;
  blueHourMorning: string;
  blueHourEvening: string;
}

interface WeatherData {
  location: string;
  locationDetails?: {
    lat: number;
    lng: number;
  };
  forecast: WeatherDay[];
  lastUpdated: string;
  isDemoMode?: boolean;
}

const LOCATIONS: { name: string; lat: number; lng: number; state?: string }[] = [
  { name: 'Chennai', lat: 13.08, lng: 80.27, state: 'Tamil Nadu' },
  { name: 'Coimbatore', lat: 11.01, lng: 76.97, state: 'Tamil Nadu' },
  { name: 'Madurai', lat: 9.92, lng: 78.12, state: 'Tamil Nadu' },
  { name: 'Ooty', lat: 11.41, lng: 76.69, state: 'Tamil Nadu' },
  { name: 'Hyderabad', lat: 17.39, lng: 78.49, state: 'Telangana' },
  { name: 'Kochi', lat: 9.93, lng: 76.26, state: 'Kerala' },
  { name: 'Rameshwaram', lat: 9.29, lng: 79.31, state: 'Tamil Nadu' },
  { name: 'Bangalore', lat: 12.97, lng: 77.59, state: 'Karnataka' },
  { name: 'Mysore', lat: 12.29, lng: 76.63, state: 'Karnataka' },
  { name: 'Trichy', lat: 10.79, lng: 78.69, state: 'Tamil Nadu' },
];

function getConditionIcon(condition: string, iconCode: number) {
  const c = condition.toLowerCase();
  if (c.includes('thunder') || (iconCode >= 200 && iconCode < 300)) return CloudLightning;
  if (c.includes('rain') || c.includes('drizzle') || (iconCode >= 300 && iconCode < 600)) return CloudRain;
  if (c.includes('snow') || (iconCode >= 600 && iconCode < 700)) return Snowflake;
  if (c.includes('fog') || c.includes('mist') || c.includes('haze') || (iconCode >= 700 && iconCode < 800)) return CloudFog;
  if (c.includes('cloud') || (iconCode > 800)) return Cloud;
  return Sun;
}

function getConditionColor(condition: string, iconCode: number): string {
  if (iconCode >= 200 && iconCode < 300) return 'from-purple-600 to-indigo-600';
  if (iconCode >= 300 && iconCode < 400) return 'from-blue-600 to-cyan-600';
  if (iconCode >= 500 && iconCode < 600) return 'from-blue-700 to-slate-600';
  if (iconCode >= 600 && iconCode < 700) return 'from-blue-200 to-white';
  if (iconCode >= 700 && iconCode < 800) return 'from-slate-400 to-slate-600';
  if (iconCode === 800) return 'from-amber-500 to-orange-500';
  if (iconCode > 800) return 'from-slate-400 to-slate-500';
  return 'from-blue-400 to-indigo-500';
}

// Calculate production score based on weather conditions (0-100)
function getProductionScore(day: WeatherDay): number {
  let score = 100;
  
  // Precipitation impact
  if (day.precipitationChance > 60) score -= 40;
  else if (day.precipitationChance > 30) score -= 20;
  else if (day.precipitationChance > 10) score -= 5;
  
  // Wind impact
  if (day.windSpeed > 30) score -= 20;
  else if (day.windSpeed > 20) score -= 10;
  else if (day.windSpeed > 10) score -= 5;
  
  // Humidity impact
  if (day.humidity > 85) score -= 15;
  else if (day.humidity > 75) score -= 8;
  
  // Temperature impact (extreme temps not ideal)
  if (day.tempHigh > 40 || day.tempHigh < 15) score -= 15;
  else if (day.tempHigh > 35 || day.tempHigh < 20) score -= 5;
  
  // Visibility impact
  if (day.visibility < 5000) score -= 20;
  else if (day.visibility < 8000) score -= 10;
  
  // UV impact (for outdoor shooting)
  if (day.uvIndex >= 10) score -= 10;
  else if (day.uvIndex >= 8) score -= 5;
  
  return Math.max(0, Math.min(100, score));
}

function getScoreColor(score: number): { bg: string; text: string; label: string } {
  if (score >= 80) return { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Excellent' };
  if (score >= 60) return { bg: 'bg-green-500/20', text: 'text-green-400', label: 'Good' };
  if (score >= 40) return { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Fair' };
  if (score >= 20) return { bg: 'bg-orange-500/20', text: 'text-orange-400', label: 'Poor' };
  return { bg: 'bg-red-500/20', text: 'text-red-400', label: 'Avoid' };
}

export default function WeatherPage() {
  const [selectedLocation, setSelectedLocation] = useState<(typeof LOCATIONS)[0] | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);

  const fetchWeather = useCallback(async (location: (typeof LOCATIONS)[0]) => {
    setSelectedLocation(location);
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        lat: String(location.lat),
        lng: String(location.lng),
        location: location.name,
      });
      const res = await fetch(`/api/weather?${params}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to fetch weather');
        setWeatherData(null);
        return;
      }

      setWeatherData(data);
    } catch (e) {
      setError('Failed to fetch weather');
      setWeatherData(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshWeather = useCallback(() => {
    if (selectedLocation) {
      fetchWeather(selectedLocation);
    }
  }, [selectedLocation, fetchWeather]);

  const selectedDay = weatherData?.forecast[selectedDayIndex];

  const chartData = useMemo(() => {
    if (!weatherData?.forecast) return [];
    return weatherData.forecast.map((day) => ({
      name: day.dayName.substring(0, 3),
      high: day.tempHigh,
      low: day.tempLow,
      humidity: day.humidity,
      precip: day.precipitationChance,
    }));
  }, [weatherData]);

  // Auto-select first day when data loads
  const handleLocationSelect = (loc: (typeof LOCATIONS)[0]) => {
    setSelectedDayIndex(0);
    fetchWeather(loc);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Header */}
      <header className="bg-slate-900/50 backdrop-blur border-b border-slate-800">
        <div className="px-8 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-semibold tracking-tight">Weather Forecast</h1>
                  {weatherData?.isDemoMode && (
                    <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full font-medium">
                      Demo Data
                    </span>
                  )}
                </div>
                <p className="text-slate-500 text-sm mt-0.5">
                  Production-ready 5-day outlook for South Indian film locations
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              {weatherData && (
                <span className="text-xs text-slate-500">
                  Updated: {new Date(weatherData.lastUpdated).toLocaleTimeString('en-IN')}
                </span>
              )}
              {selectedLocation && (
                <button
                  onClick={refreshWeather}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50 transition-colors"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Refresh
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="p-8">
        {/* Location Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-8">
          {LOCATIONS.map((loc) => (
            <button
              key={loc.name}
              onClick={() => handleLocationSelect(loc)}
              className={`p-4 rounded-xl text-left transition-all border ${
                selectedLocation?.name === loc.name
                  ? 'bg-indigo-500/10 border-indigo-500 ring-2 ring-indigo-500/30'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2 mb-1">
                <MapPin className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span className="font-medium text-slate-200 truncate">{loc.name}</span>
              </div>
              {loc.state && (
                <p className="text-xs text-slate-500">{loc.state}</p>
              )}
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && !weatherData && (
          <div className="flex items-center justify-center py-20">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
              <p className="text-slate-400">Loading weather data...</p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 rounded-xl bg-red-500/10 border border-red-500/30">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <div>
                <p className="font-medium text-red-400">Could not load weather</p>
                <p className="text-sm text-red-300/80 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Weather Content */}
        {weatherData && !loading && (
          <div className="space-y-6">
            {/* Main Weather Display */}
            {selectedDay && (
              <div className={`bg-gradient-to-br ${getConditionColor(selectedDay.condition, selectedDay.iconCode)} rounded-2xl p-6 md:p-8`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  {/* Date & Condition */}
                  <div className="flex items-center gap-4">
                    {(() => {
                      const Icon = getConditionIcon(selectedDay.condition, selectedDay.iconCode);
                      return (
                        <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                          <Icon className="w-12 h-12 text-white" />
                        </div>
                      );
                    })()}
                    <div>
                      <p className="text-white/80 text-sm">{selectedDay.dayName}</p>
                      <h2 className="text-3xl font-bold text-white">
                        {new Date(selectedDay.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                      </h2>
                      <p className="text-white/80 capitalize mt-1">{selectedDay.conditionDetailed}</p>
                    </div>
                  </div>

                  {/* Temperature */}
                  <div className="flex items-center gap-8">
                    <div className="text-center">
                      <Thermometer className="w-6 h-6 text-white/60 mx-auto mb-1" />
                      <p className="text-4xl font-bold text-white">{selectedDay.tempHigh}°</p>
                      <p className="text-white/60 text-sm">High</p>
                    </div>
                    <div className="text-center">
                      <p className="text-4xl font-bold text-white/50">{selectedDay.tempLow}°</p>
                      <p className="text-white/60 text-sm">Low</p>
                    </div>
                  </div>

                  {/* Production Status */}
                  <div className={`px-6 py-4 rounded-xl ${
                    selectedDay.recommendationSeverity === 'green' 
                      ? 'bg-emerald-500/30' 
                      : selectedDay.recommendationSeverity === 'amber'
                        ? 'bg-amber-500/30'
                        : 'bg-red-500/30'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {selectedDay.recommendationSeverity === 'green' ? (
                        <CheckCircle className="w-5 h-5 text-white" />
                      ) : selectedDay.recommendationSeverity === 'amber' ? (
                        <Clock className="w-5 h-5 text-white" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-white" />
                      )}
                      <span className="font-semibold text-white">
                        {selectedDay.recommendationSeverity === 'green' ? 'Good to Shoot' : selectedDay.recommendationSeverity === 'amber' ? 'Use Caution' : 'Not Recommended'}
                      </span>
                    </div>
                    <p className="text-white/90 text-sm">{selectedDay.recommendation}</p>
                    <p className="text-white/70 text-xs mt-2 flex items-center gap-1">
                      <Camera className="w-3 h-3" /> Best: {selectedDay.bestTimeToShoot}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Day Selector */}
            <div className="flex gap-2 overflow-x-auto pb-2">
              {weatherData.forecast.map((day, idx) => (
                <button
                  key={day.date}
                  onClick={() => setSelectedDayIndex(idx)}
                  className={`flex-shrink-0 p-4 rounded-xl border transition-all ${
                    selectedDayIndex === idx
                      ? 'bg-indigo-500/10 border-indigo-500 ring-2 ring-indigo-500/30'
                      : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <p className="text-xs text-slate-500 mb-1">{day.dayName.substring(0, 3)}</p>
                  <p className="font-semibold text-white">{new Date(day.date).getDate()}</p>
                  <div className="mt-2">
                    {(() => {
                      const Icon = getConditionIcon(day.condition, day.iconCode);
                      return <Icon className="w-5 h-5 text-slate-400" />;
                    })()}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">{day.tempHigh}°/{day.tempLow}°</p>
                </button>
              ))}
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Temperature Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Thermometer className="w-5 h-5 text-amber-400" />
                  Temperature Forecast
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Area type="monotone" dataKey="high" stroke="#f59e0b" fill="url(#tempGradient)" name="High °C" strokeWidth={2} />
                      <Line type="monotone" dataKey="low" stroke="#06b6d4" strokeWidth={2} dot={{ fill: '#06b6d4' }} name="Low °C" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Precipitation Chart */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CloudRain className="w-5 h-5 text-blue-400" />
                  Precipitation & Humidity
                </h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="precipGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                      <YAxis stroke="#64748b" fontSize={12} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                        labelStyle={{ color: '#e2e8f0' }}
                      />
                      <Area type="monotone" dataKey="precip" stroke="#3b82f6" fill="url(#precipGradient)" name="Precipitation %" strokeWidth={2} />
                      <Line type="monotone" dataKey="humidity" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} name="Humidity %" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Detailed Day Info */}
            {selectedDay && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Weather Metrics */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Weather Details</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-400">
                        <Droplets className="w-4 h-4" /> Humidity
                      </span>
                      <span className="text-white font-medium">{selectedDay.humidity}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-400">
                        <Wind className="w-4 h-4" /> Wind
                      </span>
                      <span className="text-white font-medium">{selectedDay.windSpeed} km/h</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-400">
                        <CloudRain className="w-4 h-4" /> Precipitation
                      </span>
                      <span className="text-white font-medium">{selectedDay.precipitationChance}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-400">
                        <Eye className="w-4 h-4" /> Visibility
                      </span>
                      <span className="text-white font-medium">{(selectedDay.visibility / 1000).toFixed(1)} km</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-400">
                        <Zap className="w-4 h-4" /> UV Index
                      </span>
                      <span className={`font-medium ${
                        selectedDay.uvIndex >= 8 ? 'text-red-400' : selectedDay.uvIndex >= 5 ? 'text-amber-400' : 'text-green-400'
                      }`}>
                        {selectedDay.uvIndex} {selectedDay.uvIndex >= 8 ? '(Very High)' : selectedDay.uvIndex >= 5 ? '(Moderate)' : '(Low)'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Light Hours */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5">
                  <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Light Hours</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-400">
                        <Sunrise className="w-4 h-4 text-amber-400" /> Sunrise
                      </span>
                      <span className="text-white font-medium">{selectedDay.sunrise}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-slate-400">
                        <Sunset className="w-4 h-4 text-orange-400" /> Sunset
                      </span>
                      <span className="text-white font-medium">{selectedDay.sunset}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-amber-400">Blue Hour (AM)</span>
                        <span className="text-white text-sm">{selectedDay.blueHourMorning}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-amber-400">Golden Hour (AM)</span>
                        <span className="text-white text-sm">{selectedDay.goldenHourMorning}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-orange-400">Golden Hour (PM)</span>
                        <span className="text-white text-sm">{selectedDay.goldenHourEvening}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-blue-400">Blue Hour (PM)</span>
                        <span className="text-white text-sm">{selectedDay.blueHourEvening}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Production Notes */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 md:col-span-2">
                  <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2">
                    <Film className="w-4 h-4" />
                    Production Notes
                  </h3>
                  <div className="space-y-2">
                    {selectedDay.shootingNotes.map((note, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-sm">
                        <span className="text-indigo-400 mt-0.5">•</span>
                        <span className="text-slate-300">{note}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-slate-800">
                    <p className="text-sm">
                      <span className="text-slate-400">Best time to shoot:</span>{' '}
                      <span className="text-emerald-400 font-medium">{selectedDay.bestTimeToShoot}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* All Days Summary */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">5-Day Production Outlook</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-slate-500 text-sm border-b border-slate-800">
                      <th className="pb-3 font-medium">Day</th>
                      <th className="pb-3 font-medium">Condition</th>
                      <th className="pb-3 font-medium">Temp</th>
                      <th className="pb-3 font-medium">Humidity</th>
                      <th className="pb-3 font-medium">Wind</th>
                      <th className="pb-3 font-medium">Rain %</th>
                      <th className="pb-3 font-medium">Score</th>
                      <th className="pb-3 font-medium">Shooting</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weatherData.forecast.map((day) => (
                      <tr key={day.date} className="border-b border-slate-800/50 hover:bg-slate-800/30">
                        <td className="py-3">
                          <p className="text-white font-medium">{day.dayName}</p>
                          <p className="text-slate-500 text-xs">{new Date(day.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</p>
                        </td>
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            {(() => {
                              const Icon = getConditionIcon(day.condition, day.iconCode);
                              return <Icon className="w-4 h-4 text-slate-400" />;
                            })()}
                            <span className="text-slate-300">{day.condition}</span>
                          </div>
                        </td>
                        <td className="py-3 text-slate-300">
                          {day.tempHigh}° / {day.tempLow}°
                        </td>
                        <td className="py-3 text-slate-300">{day.humidity}%</td>
                        <td className="py-3 text-slate-300">{day.windSpeed} km/h</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded text-xs ${
                            day.precipitationChance > 60 ? 'bg-red-500/20 text-red-400' :
                            day.precipitationChance > 30 ? 'bg-amber-500/20 text-amber-400' :
                            'bg-green-500/20 text-green-400'
                          }`}>
                            {day.precipitationChance}%
                          </span>
                        </td>
                        <td className="py-3">
                          {(() => {
                            const score = getProductionScore(day);
                            const colors = getScoreColor(score);
                            return (
                              <div className="flex items-center gap-2">
                                <div className="w-12 h-2 bg-slate-700 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full ${colors.bg.replace('/20', '')}`} 
                                    style={{ width: `${score}%`, backgroundColor: score >= 80 ? '#10b981' : score >= 60 ? '#22c55e' : score >= 40 ? '#f59e0b' : score >= 20 ? '#f97316' : '#ef4444' }}
                                  />
                                </div>
                                <span className={`text-sm font-medium ${colors.text}`}>{score}</span>
                              </div>
                            );
                          })()}
                        </td>
                        <td className="py-3">
                          <span className={`flex items-center gap-1 text-xs ${
                            day.recommendationSeverity === 'green' ? 'text-emerald-400' :
                            day.recommendationSeverity === 'amber' ? 'text-amber-400' :
                            'text-red-400'
                          }`}>
                            {day.recommendationSeverity === 'green' ? (
                              <CheckCircle className="w-3 h-3" />
                            ) : day.recommendationSeverity === 'amber' ? (
                              <Clock className="w-3 h-3" />
                            ) : (
                              <AlertTriangle className="w-3 h-3" />
                            )}
                            {day.recommendationSeverity === 'green' ? 'Good' : day.recommendationSeverity === 'amber' ? 'Caution' : 'Avoid'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* No Location Selected */}
        {!selectedLocation && !loading && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-12 text-center">
            <Cloud className="w-16 h-16 mx-auto text-slate-600 mb-4" />
            <h2 className="text-xl font-semibold text-white mb-2">Select a Location</h2>
            <p className="text-slate-500 mb-6 max-w-md mx-auto">
              Choose a filming location above to see the weather forecast with production recommendations.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
