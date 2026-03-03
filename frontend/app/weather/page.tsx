'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
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
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Calendar,
  BarChart3,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
} from 'recharts';

interface WeatherDay {
  date: string;
  condition: string;
  tempHigh: number;
  tempLow: number;
  humidity: number;
  windSpeed: number;
  precipitation: number;
  icon: string;
  recommendation: string;
  productionScore: number;
}

interface ScheduledDay {
  id: string;
  dayNumber: number;
  scheduledDate: string | null;
  location?: { name: string } | null;
  dayScenes: { scene: { sceneNumber: string; headingRaw: string | null } }[];
}

interface ScheduleData {
  shootingDays?: ScheduledDay[];
  days?: ScheduledDay[];
}

interface WeatherData {
  location: string;
  lat: number;
  lng: number;
  forecast: WeatherDay[];
  isDemo?: boolean;
}

interface Location {
  name: string;
  lat: number;
  lng: number;
}

const LOCATIONS: Location[] = [
  { name: 'Chennai', lat: 13.08, lng: 80.27 },
  { name: 'Coimbatore', lat: 11.01, lng: 76.97 },
  { name: 'Madurai', lat: 9.92, lng: 78.12 },
  { name: 'Ooty', lat: 11.41, lng: 76.69 },
  { name: 'Hyderabad', lat: 17.39, lng: 78.49 },
  { name: 'Kochi', lat: 9.93, lng: 76.26 },
  { name: 'Rameshwaram', lat: 9.29, lng: 79.31 },
];

const COLORS = {
  primary: '#6366f1',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  info: '#06b6d4',
  purple: '#8b5cf6',
  muted: '#64748b',
};

function getRecommendationColor(recommendation: string): 'green' | 'amber' | 'red' {
  const lower = recommendation.toLowerCase();
  if (
    lower.includes('avoid') ||
    lower.includes('indoor alternatives') ||
    lower.includes('thunderstorm') ||
    lower.includes('plan indoor')
  ) {
    return 'red';
  }
  if (
    lower.includes('moderate') ||
    lower.includes('caution') ||
    lower.includes('consider') ||
    lower.includes('high humidity') ||
    lower.includes('wind protection') ||
    lower.includes('plan accordingly')
  ) {
    return 'amber';
  }
  return 'green';
}

function getConditionIcon(condition: string): typeof Sun {
  const c = condition.toLowerCase();
  if (c.includes('rain') || c.includes('drizzle')) return CloudRain;
  if (c.includes('cloud')) return Cloud;
  return Sun;
}

function getProductionScore(day: WeatherDay): number {
  let score = 100;
  const lower = day.condition.toLowerCase();

  // Weather conditions
  if (lower.includes('rain') || lower.includes('thunderstorm')) {
    score -= 60;
  } else if (lower.includes('cloud')) {
    score -= 10; // Clouds are actually good for even lighting
  }

  // Temperature
  if (day.tempHigh > 35) score -= 15;
  else if (day.tempHigh > 32) score -= 5;

  if (day.tempLow < 15) score -= 10;

  // Humidity
  if (day.humidity > 85) score -= 15;
  else if (day.humidity > 75) score -= 5;

  // Wind
  if (day.windSpeed > 30) score -= 15;
  else if (day.windSpeed > 20) score -= 5;

  // Precipitation
  if (day.precipitation > 10) score -= 30;
  else if (day.precipitation > 5) score -= 15;

  return Math.max(0, Math.min(100, score));
}

function getScoreLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: 'Excellent', color: 'text-emerald-400', bg: 'bg-emerald-500/20' };
  if (score >= 60) return { label: 'Good', color: 'text-blue-400', bg: 'bg-blue-500/20' };
  if (score >= 40) return { label: 'Moderate', color: 'text-amber-400', bg: 'bg-amber-500/20' };
  return { label: 'Poor', color: 'text-red-400', bg: 'bg-red-500/20' };
}

export default function WeatherPage() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'forecast' | 'analytics' | 'schedule'>('forecast');

  // Fetch schedule data for integration
  const fetchScheduleData = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const res = await fetch('/api/schedule');
      const data = await res.json();
      if (data.days) {
        setScheduleData(data);
      }
    } catch (e) {
      console.warn('Could not fetch schedule data:', e);
    } finally {
      setScheduleLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  const fetchWeather = useCallback(async (location: Location) => {
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

      // Add production scores to each day
      const enhancedData: WeatherData = {
        ...data,
        lat: location.lat,
        lng: location.lng,
        forecast: (data.forecast || []).map((day: WeatherDay) => ({
          ...day,
          productionScore: getProductionScore(day),
        })),
      };

      setWeatherData(enhancedData);
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

  // Analytics calculations
  const analytics = useMemo(() => {
    if (!weatherData?.forecast?.length) return null;

    const forecast = weatherData.forecast;

    // Temperature trend
    const tempData = forecast.map((d) => ({
      date: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }),
      high: d.tempHigh,
      low: d.tempLow,
      avg: Math.round((d.tempHigh + d.tempLow) / 2),
    }));

    // Production scores
    const scoreData = forecast.map((d) => ({
      date: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }),
      score: d.productionScore,
      label: getScoreLabel(d.productionScore).label,
    }));

    // Precipitation
    const precipData = forecast.map((d) => ({
      date: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }),
      precipitation: d.precipitation,
    }));

    // Conditions breakdown
    const conditions: Record<string, number> = {};
    forecast.forEach((d) => {
      conditions[d.condition] = (conditions[d.condition] || 0) + 1;
    });
    const conditionData = Object.entries(conditions).map(([name, value]) => ({
      name,
      value,
    }));

    // Summary stats
    const avgTemp = Math.round(forecast.reduce((s, d) => s + d.tempHigh, 0) / forecast.length);
    const avgHumidity = Math.round(forecast.reduce((s, d) => s + d.humidity, 0) / forecast.length);
    const avgWind = Math.round(forecast.reduce((s, d) => s + d.windSpeed, 0) / forecast.length);
    const avgScore = Math.round(forecast.reduce((s, d) => s + d.productionScore, 0) / forecast.length);
    const bestDay = [...forecast].sort((a, b) => b.productionScore - a.productionScore)[0];
    const worstDay = [...forecast].sort((a, b) => a.productionScore - b.productionScore)[0];
    const excellentDays = forecast.filter((d) => d.productionScore >= 80).length;
    const goodDays = forecast.filter((d) => d.productionScore >= 60 && d.productionScore < 80).length;

    return {
      tempData,
      scoreData,
      precipData,
      conditionData,
      stats: {
        avgTemp,
        avgHumidity,
        avgWind,
        avgScore,
        bestDay,
        worstDay,
        excellentDays,
        goodDays,
        totalDays: forecast.length,
      },
    };
  }, [weatherData]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500">
                <Cloud className="w-5 h-5 text-white" />
              </div>
              Weather Forecast
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              5-day outlook with production impact analysis for South Indian film locations
            </p>
          </div>
          <div className="flex items-center gap-4">
            {weatherData?.isDemo && (
              <span className="px-3 py-1 bg-amber-500/20 text-amber-400 text-xs rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
                Demo Data
              </span>
            )}
            {selectedLocation && (
              <>
                <div className="flex bg-slate-800 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('forecast')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                      viewMode === 'forecast'
                        ? 'bg-blue-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Forecast
                  </button>
                  <button
                    onClick={() => setViewMode('analytics')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                      viewMode === 'analytics'
                        ? 'bg-blue-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Analytics
                  </button>
                  <button
                    onClick={() => setViewMode('schedule')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1.5 ${
                      viewMode === 'schedule'
                        ? 'bg-blue-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" />
                    Schedule
                  </button>
                </div>
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
              </>
            )}
          </div>
        </div>

        {/* Location Selection */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-8">
          {LOCATIONS.map((loc) => (
            <button
              key={loc.name}
              onClick={() => fetchWeather(loc)}
              className={`p-4 rounded-xl text-left transition-all border ${
                selectedLocation?.name === loc.name
                  ? 'bg-slate-800 border-blue-500 ring-1 ring-blue-500/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-blue-400 shrink-0" />
                <span className="font-medium text-slate-200 truncate">{loc.name}</span>
              </div>
              <p className="text-xs text-slate-500">
                {loc.lat.toFixed(2)}°, {loc.lng.toFixed(2)}°
              </p>
            </button>
          ))}
        </div>

        {/* Loading State */}
        {loading && !weatherData && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-blue-400" />
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="p-6 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-200">
            <p className="font-medium">Could not load weather</p>
            <p className="text-sm text-amber-200/80 mt-1">{error}</p>
          </div>
        )}

        {/* Main Content */}
        {weatherData && !loading && (
          <div className="space-y-6">
            {/* Summary Stats */}
            {analytics && (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <Thermometer className="w-3.5 h-3.5" />
                    Avg High
                  </div>
                  <p className="text-2xl font-bold text-white">{analytics.stats.avgTemp}°C</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <Droplets className="w-3.5 h-3.5" />
                    Humidity
                  </div>
                  <p className="text-2xl font-bold text-white">{analytics.stats.avgHumidity}%</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <Wind className="w-3.5 h-3.5" />
                    Wind
                  </div>
                  <p className="text-2xl font-bold text-white">{analytics.stats.avgWind} km/h</p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Avg Score
                  </div>
                  <p className={`text-2xl font-bold ${analytics.stats.avgScore >= 80 ? 'text-emerald-400' : analytics.stats.avgScore >= 60 ? 'text-blue-400' : 'text-amber-400'}`}>
                    {analytics.stats.avgScore}
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <CheckCircle className="w-3.5 h-3.5" />
                    Best Day
                  </div>
                  <p className="text-lg font-bold text-emerald-400">
                    {analytics.stats.bestDay ? new Date(analytics.stats.bestDay.date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric' }) : '--'}
                  </p>
                </div>
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 text-slate-400 text-xs mb-2">
                    <BarChart3 className="w-3.5 h-3.5" />
                    Shoot Days
                  </div>
                  <p className="text-2xl font-bold text-white">
                    {analytics.stats.excellentDays + analytics.stats.goodDays}
                    <span className="text-sm text-slate-500 font-normal">/{analytics.stats.totalDays}</span>
                  </p>
                </div>
              </div>
            )}

            {viewMode === 'forecast' ? (
              /* Forecast Cards */
              <div className="space-y-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Calendar className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-white">5-Day Forecast</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                  {weatherData.forecast.slice(0, 5).map((day) => {
                    const Icon = getConditionIcon(day.condition);
                    const recColor = getRecommendationColor(day.recommendation);
                    const scoreInfo = getScoreLabel(day.productionScore);
                    const colorClasses =
                      recColor === 'green'
                        ? 'border-emerald-500/40 bg-emerald-500/10'
                        : recColor === 'amber'
                          ? 'border-amber-500/40 bg-amber-500/10'
                          : 'border-red-500/40 bg-red-500/10';
                    const textColor =
                      recColor === 'green'
                        ? 'text-emerald-400'
                        : recColor === 'amber'
                          ? 'text-amber-400'
                          : 'text-red-400';

                    return (
                      <div
                        key={day.date}
                        className="p-5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition-all"
                      >
                        {/* Date & Condition */}
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <p className="font-semibold text-white">
                              {new Date(day.date).toLocaleDateString('en-IN', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(day.date).toLocaleDateString('en-IN', { month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 p-2 rounded-lg bg-slate-800">
                            <Icon className="w-5 h-5 text-slate-400" />
                            <span className="text-sm text-slate-400">{day.condition}</span>
                          </div>
                        </div>

                        {/* Temperature */}
                        <div className="flex items-center gap-4 mb-4">
                          <div className="flex items-center gap-1">
                            <Thermometer className="w-4 h-4 text-red-400" />
                            <span className="text-lg font-semibold text-white">{day.tempHigh}°</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Thermometer className="w-4 h-4 text-blue-400" />
                            <span className="text-lg font-semibold text-slate-300">{day.tempLow}°</span>
                          </div>
                        </div>

                        {/* Details */}
                        <div className="flex flex-wrap gap-3 text-sm text-slate-400 mb-4">
                          <span className="flex items-center gap-1">
                            <Droplets className="w-3.5 h-3.5" />
                            {day.humidity}%
                          </span>
                          <span className="flex items-center gap-1">
                            <Wind className="w-3.5 h-3.5" />
                            {day.windSpeed} km/h
                          </span>
                          {day.precipitation > 0 && (
                            <span className="flex items-center gap-1">
                              <CloudRain className="w-3.5 h-3.5" />
                              {day.precipitation} mm
                            </span>
                          )}
                        </div>

                        {/* Production Score */}
                        <div className="mb-3">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-slate-500">Production Score</span>
                            <span className={`font-semibold ${scoreInfo.color}`}>{day.productionScore}/100</span>
                          </div>
                          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                day.productionScore >= 80
                                  ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                                  : day.productionScore >= 60
                                    ? 'bg-gradient-to-r from-blue-500 to-blue-400'
                                    : day.productionScore >= 40
                                      ? 'bg-gradient-to-r from-amber-500 to-amber-400'
                                      : 'bg-gradient-to-r from-red-500 to-red-400'
                              }`}
                              style={{ width: `${day.productionScore}%` }}
                            />
                          </div>
                        </div>

                        {/* Recommendation */}
                        <div className={`p-3 rounded-lg border text-sm ${colorClasses} ${textColor}`}>
                          {day.recommendation}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Analytics View */
              analytics && (
                <div className="space-y-6">
                  {/* Temperature Trend */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <Thermometer className="w-5 h-5 text-red-400" />
                      Temperature Trend
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={analytics.tempData}>
                          <defs>
                            <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor={COLORS.danger} stopOpacity={0.3} />
                              <stop offset="95%" stopColor={COLORS.danger} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                          <YAxis stroke="#64748b" fontSize={12} domain={[15, 40]} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                          />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="high"
                            stroke={COLORS.danger}
                            fill="url(#tempGradient)"
                            name="High °C"
                          />
                          <Area
                            type="monotone"
                            dataKey="low"
                            stroke={COLORS.info}
                            fill="none"
                            name="Low °C"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Production Score */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-emerald-400" />
                      Production Score by Day
                    </h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={analytics.scoreData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                          <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                            formatter={(value: number) => [`${value}/100`, 'Score']}
                          />
                          <Bar
                            dataKey="score"
                            name="Production Score"
                            radius={[4, 4, 0, 0]}
                          >
                            {analytics.scoreData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={
                                  entry.score >= 80
                                    ? COLORS.success
                                    : entry.score >= 60
                                      ? COLORS.primary
                                      : entry.score >= 40
                                        ? COLORS.warning
                                        : COLORS.danger
                                }
                              />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Conditions & Precipitation */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4">Weather Conditions</h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={analytics.conditionData}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={100}
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, value }) => `${name}: ${value}`}
                            >
                              {analytics.conditionData.map((entry, index) => (
                                <Cell
                                  key={`cell-${index}`}
                                  fill={index === 0 ? COLORS.primary : index === 1 ? COLORS.info : COLORS.muted}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <CloudRain className="w-5 h-5 text-blue-400" />
                        Precipitation Forecast
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.precipData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                              formatter={(value: number) => [`${value} mm`, 'Rain']}
                            />
                            <Bar dataKey="precipitation" fill={COLORS.info} radius={[4, 4, 0, 0]} name="Precipitation (mm)" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>

                  {/* Best Days Recommendation */}
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-emerald-400" />
                      Recommended Shooting Days
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {weatherData.forecast
                        .sort((a, b) => b.productionScore - a.productionScore)
                        .slice(0, 3)
                        .map((day, idx) => (
                          <div
                            key={day.date}
                            className={`p-4 rounded-lg border ${
                              idx === 0
                                ? 'border-emerald-500/50 bg-emerald-500/10'
                                : 'border-blue-500/50 bg-blue-500/10'
                            }`}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              {idx === 0 && <span className="text-lg">🥇</span>}
                              {idx === 1 && <span className="text-lg">🥈</span>}
                              {idx === 2 && <span className="text-lg">🥉</span>}
                              <span className="font-semibold text-white">
                                {new Date(day.date).toLocaleDateString('en-IN', {
                                  weekday: 'long',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                            </div>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="text-slate-400">{day.condition}</span>
                              <span className="text-slate-400">{day.tempHigh}°/{day.tempLow}°</span>
                              <span className="text-emerald-400 font-semibold">{day.productionScore}%</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              )
            )}

            {/* Schedule Integration View */}
            {viewMode === 'schedule' && weatherData && (
              <div className="space-y-6">
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-400" />
                    Schedule-Weather Integration
                  </h3>
                  <p className="text-sm text-slate-400 mb-6">
                    See how your scheduled shooting days align with weather conditions
                  </p>

                  {scheduleLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-6 h-6 text-slate-400 animate-spin" />
                      <span className="ml-2 text-slate-400">Loading schedule...</span>
                    </div>
                  ) : (scheduleData?.shootingDays || scheduleData?.days) && (scheduleData?.shootingDays || scheduleData?.days)!.length > 0 ? (
                    <div className="space-y-4">
                      {(scheduleData.shootingDays || scheduleData.days || []).map((day) => {
                        const scheduledDate = day.scheduledDate;
                        const scheduledDateStr = scheduledDate ? scheduledDate.split('T')[0] : null;
                        const matchingWeather = scheduledDateStr
                          ? weatherData.forecast.find(
                              (w) => w.date === scheduledDateStr
                            )
                          : null;

                        const scoreInfo = matchingWeather
                          ? getScoreLabel(matchingWeather.productionScore)
                          : null;

                        return (
                          <div
                            key={day.id}
                            className={`p-4 rounded-lg border ${
                              !scheduledDate
                                ? 'border-slate-700 bg-slate-800/50'
                                : matchingWeather
                                ? matchingWeather.productionScore >= 80
                                  ? 'border-emerald-500/50 bg-emerald-500/10'
                                  : matchingWeather.productionScore >= 60
                                    ? 'border-blue-500/50 bg-blue-500/10'
                                    : matchingWeather.productionScore >= 40
                                      ? 'border-amber-500/50 bg-amber-500/10'
                                      : 'border-red-500/50 bg-red-500/10'
                                : 'border-slate-700 bg-slate-800/50'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-4">
                                <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-slate-800">
                                  <span className="text-lg font-bold text-white">
                                    {day.dayNumber}
                                  </span>
                                </div>
                                <div>
                                  <p className="font-semibold text-white">
                                    Day {day.dayNumber}
                                    {!scheduledDate && (
                                      <span className="ml-2 text-xs text-slate-500">
                                        (No date set)
                                      </span>
                                    )}
                                  </p>
                                  {scheduledDate && (
                                    <p className="text-sm text-slate-400">
                                      {new Date(scheduledDateStr!).toLocaleDateString(
                                        'en-IN',
                                        {
                                          weekday: 'long',
                                          month: 'short',
                                          day: 'numeric',
                                        }
                                      )}
                                    </p>
                                  )}
                                  {day.location?.name && (
                                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                                      <MapPin className="w-3 h-3" />
                                      {day.location.name}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-4">
                                {scheduledDate && matchingWeather ? (
                                  <>
                                    <div className="text-right">
                                      <p className="text-sm text-slate-400">
                                        {matchingWeather.condition}
                                      </p>
                                      <p className="text-xs text-slate-500">
                                        {matchingWeather.tempHigh}°/{matchingWeather.tempLow}°
                                      </p>
                                    </div>
                                    <div
                                      className={`px-3 py-2 rounded-lg ${scoreInfo?.bg}`}
                                    >
                                      <p className={`text-lg font-bold ${scoreInfo?.color}`}>
                                        {matchingWeather.productionScore}
                                      </p>
                                      <p className="text-xs text-slate-400">Score</p>
                                    </div>
                                  </>
                                ) : scheduledDate ? (
                                  <div className="text-right">
                                    <p className="text-sm text-amber-400">
                                      No forecast available
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Date outside 5-day range
                                    </p>
                                  </div>
                                ) : (
                                  <div className="text-right">
                                    <p className="text-sm text-slate-500">
                                      Schedule a date to see weather
                                    </p>
                                  </div>
                                )}
                              </div>
                            </div>

                            {matchingWeather && (
                              <div className="mt-3 pt-3 border-t border-slate-700">
                                <p className="text-xs text-slate-400">
                                  {matchingWeather.recommendation}
                                </p>
                              </div>
                            )}

                            {day.dayScenes.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-700">
                                <p className="text-xs text-slate-500 mb-2">
                                  {day.dayScenes.length} scene(s) scheduled
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {day.dayScenes.slice(0, 3).map((ds, idx) => (
                                    <span
                                      key={idx}
                                      className="text-xs px-2 py-1 bg-slate-800 rounded text-slate-400"
                                    >
                                      {ds.scene.sceneNumber}
                                    </span>
                                  ))}
                                  {day.dayScenes.length > 3 && (
                                    <span className="text-xs px-2 py-1 text-slate-500">
                                      +{day.dayScenes.length - 3} more
                                    </span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500">
                      <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>No shooting schedule found</p>
                      <p className="text-xs text-slate-600 mt-1">
                        Create a shooting schedule to see weather integration
                      </p>
                    </div>
                  )}
                </div>

                {/* Weather impact summary for schedule */}
                {(scheduleData?.shootingDays || scheduleData?.days) && (scheduleData?.shootingDays || scheduleData?.days)!.length > 0 && weatherData.forecast && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <p className="text-xs text-slate-500 uppercase">Scheduled Days</p>
                      <p className="text-2xl font-bold text-white mt-1">
                        {(scheduleData.shootingDays || scheduleData.days || []).filter(d => d.scheduledDate).length}
                      </p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <p className="text-xs text-slate-500 uppercase">Optimal Weather</p>
                      <p className="text-2xl font-bold text-emerald-400 mt-1">
                        {(scheduleData.shootingDays || scheduleData.days || []).filter(d => {
                          const weather = d.scheduledDate 
                            ? weatherData.forecast.find(w => w.date === d.scheduledDate?.split('T')[0])
                            : null;
                          return weather && weather.productionScore >= 80;
                        }).length}
                      </p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <p className="text-xs text-slate-500 uppercase">Caution Needed</p>
                      <p className="text-2xl font-bold text-amber-400 mt-1">
                        {(scheduleData.shootingDays || scheduleData.days || []).filter(d => {
                          const weather = d.scheduledDate 
                            ? weatherData.forecast.find(w => w.date === d.scheduledDate?.split('T')[0])
                            : null;
                          return weather && weather.productionScore >= 40 && weather.productionScore < 80;
                        }).length}
                      </p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                      <p className="text-xs text-slate-500 uppercase">Poor Conditions</p>
                      <p className="text-2xl font-bold text-red-400 mt-1">
                        {(scheduleData.shootingDays || scheduleData.days || []).filter(d => {
                          const weather = d.scheduledDate 
                            ? weatherData.forecast.find(w => w.date === d.scheduledDate?.split('T')[0])
                            : null;
                          return weather && weather.productionScore < 40;
                        }).length}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!selectedLocation && !loading && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-4">
              <Cloud className="w-8 h-8 text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Select a Location</h3>
            <p className="text-slate-500 max-w-md">
              Choose a filming location above to view the 5-day weather forecast with production impact analysis
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
