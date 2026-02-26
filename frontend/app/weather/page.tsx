'use client';

import { useState, useCallback } from 'react';
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
} from 'lucide-react';

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
}

interface WeatherData {
  location: string;
  forecast: WeatherDay[];
}

const LOCATIONS: { name: string; lat: number; lng: number }[] = [
  { name: 'Chennai', lat: 13.08, lng: 80.27 },
  { name: 'Coimbatore', lat: 11.01, lng: 76.97 },
  { name: 'Madurai', lat: 9.92, lng: 78.12 },
  { name: 'Ooty', lat: 11.41, lng: 76.69 },
  { name: 'Hyderabad', lat: 17.39, lng: 78.49 },
  { name: 'Kochi', lat: 9.93, lng: 76.26 },
  { name: 'Rameshwaram', lat: 9.29, lng: 79.31 },
];

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

export default function WeatherPage() {
  const [selectedLocation, setSelectedLocation] = useState<(typeof LOCATIONS)[0] | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeather = useCallback(
    async (location: (typeof LOCATIONS)[0]) => {
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
    },
    []
  );

  const refreshWeather = useCallback(() => {
    if (selectedLocation) {
      fetchWeather(selectedLocation);
    }
  }, [selectedLocation, fetchWeather]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold text-white">Weather Forecast</h1>
            <p className="text-slate-400 text-sm mt-1">
              5-day outlook for South Indian production locations
            </p>
          </div>
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

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 md:gap-4 mb-8">
          {LOCATIONS.map((loc) => (
            <button
              key={loc.name}
              onClick={() => fetchWeather(loc)}
              className={`p-4 rounded-xl text-left transition-all border ${
                selectedLocation?.name === loc.name
                  ? 'bg-slate-800 border-indigo-500 ring-1 ring-indigo-500/50'
                  : 'bg-slate-900 border-slate-800 hover:border-slate-700 hover:bg-slate-800/80'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="font-medium text-slate-200 truncate">{loc.name}</span>
              </div>
              <p className="text-xs text-slate-500">
                {loc.lat.toFixed(2)}, {loc.lng.toFixed(2)}
              </p>
            </button>
          ))}
        </div>

        {loading && !weatherData && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-10 h-10 animate-spin text-indigo-400" />
          </div>
        )}

        {error && !loading && (
          <div className="p-6 rounded-xl bg-slate-900 border border-amber-500/30 text-amber-200">
            <p className="font-medium">Could not load weather</p>
            <p className="text-sm text-amber-200/80 mt-1">{error}</p>
          </div>
        )}

        {weatherData && !loading && (
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-lg bg-indigo-500/20">
                <MapPin className="w-5 h-5 text-indigo-400" />
              </div>
              <h2 className="text-xl font-semibold text-white">{weatherData.location}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {weatherData.forecast.slice(0, 5).map((day) => {
                const Icon = getConditionIcon(day.condition);
                const recColor = getRecommendationColor(day.recommendation);
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
                    className="p-4 rounded-xl bg-slate-900 border border-slate-800"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="font-medium text-slate-200">
                        {new Date(day.date).toLocaleDateString('en-IN', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      <div className="flex items-center gap-2 p-1.5 rounded-lg bg-slate-800">
                        <Icon className="w-5 h-5 text-slate-400" />
                        <span className="text-sm text-slate-400">{day.condition}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex items-center gap-1">
                        <Thermometer className="w-4 h-4 text-slate-500" />
                        <span className="text-slate-200">
                          {day.tempHigh} / {day.tempLow} C
                        </span>
                      </div>
                    </div>

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

                    <div
                      className={`p-3 rounded-lg border text-sm ${colorClasses} ${textColor}`}
                    >
                      {day.recommendation}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {!selectedLocation && !loading && (
          <p className="text-center text-slate-500 py-12">
            Select a location to view the 5-day forecast
          </p>
        )}
      </div>
    </div>
  );
}
