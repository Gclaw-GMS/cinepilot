'use client';

import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
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
  Download,
  Plus,
  X,
  Search,
  Filter,
  HelpCircle,
  ChevronDown,
  ChevronRight,
  FileText,
  FileJson,
  Printer,
  Clock,
  Lightbulb,
  Film,
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

interface HourlyWeatherData {
  hour: string;
  time: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  precipitationChance: number;
  precipitation: number;
  cloudCover: number;
  visibility: number;
  condition: string;
  icon: string;
  recommendation: string;
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
  // Tamil Nadu - Film Industry Hub
  { name: 'Chennai', lat: 13.08, lng: 80.27 },
  { name: 'Coimbatore', lat: 11.01, lng: 76.97 },
  { name: 'Madurai', lat: 9.92, lng: 78.12 },
  { name: 'Ooty', lat: 11.41, lng: 76.69 },
  { name: 'Rameshwaram', lat: 9.29, lng: 79.31 },
  { name: 'Kanyakumari', lat: 8.08, lng: 77.54 },
  { name: 'Thanjavur', lat: 10.78, lng: 79.13 },
  // Other Indian Film Hubs
  { name: 'Hyderabad', lat: 17.39, lng: 78.49 },
  { name: 'Kochi', lat: 9.93, lng: 76.26 },
  { name: 'Mumbai', lat: 19.07, lng: 72.87 },
  { name: 'Delhi', lat: 28.61, lng: 77.21 },
  { name: 'Bengaluru', lat: 12.97, lng: 77.59 },
  { name: 'Pune', lat: 18.52, lng: 73.93 },
  { name: 'Jaipur', lat: 26.91, lng: 75.79 },
  { name: 'Goa', lat: 15.30, lng: 74.12 },
  { name: 'Srinagar', lat: 34.08, lng: 74.79 },
  { name: 'Leh', lat: 34.05, lng: 77.58 },
  { name: 'Kolkata', lat: 22.57, lng: 88.36 },
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

// Weather Alert System
interface WeatherAlert {
  id: string;
  type: 'thunderstorm' | 'rain' | 'extreme_heat' | 'extreme_cold' | 'wind' | 'humidity' | 'visibility' | 'general';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  date: string;
  affectedDay?: number;
}

function generateWeatherAlerts(forecast: WeatherDay[], shootingDays?: ScheduledDay[]): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const today = new Date();
  
  forecast.forEach((day, index) => {
    const date = new Date(day.date);
    const daysUntil = Math.ceil((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    // Thunderstorm alerts
    if (day.condition.toLowerCase().includes('thunderstorm') || day.condition.toLowerCase().includes('thunder')) {
      alerts.push({
        id: `thunder-${index}`,
        type: 'thunderstorm',
        severity: day.precipitation > 20 ? 'critical' : day.precipitation > 10 ? 'high' : 'medium',
        title: 'Thunderstorm Expected',
        description: `${day.condition} forecasted with ${day.precipitation}mm precipitation. Consider indoor alternatives or rescheduling.`,
        date: day.date,
      });
    }
    
    // Heavy rain alerts
    if (day.precipitation > 15 && !day.condition.toLowerCase().includes('thunderstorm')) {
      alerts.push({
        id: `rain-${index}`,
        type: 'rain',
        severity: day.precipitation > 30 ? 'critical' : day.precipitation > 20 ? 'high' : 'medium',
        title: 'Heavy Rain Expected',
        description: `${day.precipitation}mm rainfall expected. Outdoor shoots may be affected.`,
        date: day.date,
      });
    }
    
    // Extreme heat alerts
    if (day.tempHigh > 40) {
      alerts.push({
        id: `heat-${index}`,
        type: 'extreme_heat',
        severity: day.tempHigh > 45 ? 'critical' : 'high',
        title: 'Extreme Heat Warning',
        description: `Temperature expected to reach ${day.tempHigh}°C. Ensure crew hydration and shade provisions.`,
        date: day.date,
      });
    }
    
    // Extreme cold alerts  
    if (day.tempLow < 5) {
      alerts.push({
        id: `cold-${index}`,
        type: 'extreme_cold',
        severity: day.tempLow < 0 ? 'critical' : 'high',
        title: 'Cold Weather Alert',
        description: `Temperature dropping to ${day.tempLow}°C. Plan for heating equipment and warm breaks.`,
        date: day.date,
      });
    }
    
    // High wind alerts
    if (day.windSpeed > 40) {
      alerts.push({
        id: `wind-${index}`,
        type: 'wind',
        severity: day.windSpeed > 60 ? 'critical' : day.windSpeed > 50 ? 'high' : 'medium',
        title: 'High Wind Warning',
        description: `Wind speeds up to ${day.windSpeed} km/h expected. Grip and lighting equipment may need extra stabilization.`,
        date: day.date,
      });
    }
    
    // High humidity alerts
    if (day.humidity > 85) {
      alerts.push({
        id: `humidity-${index}`,
        type: 'humidity',
        severity: day.humidity > 95 ? 'high' : 'medium',
        title: 'High Humidity Advisory',
        description: `Humidity at ${day.humidity}%. Equipment may be affected; allow for acclimatization.`,
        date: day.date,
      });
    }
    
    // Low visibility alerts (can be from fog)
    if (day.condition.toLowerCase().includes('fog') || day.condition.toLowerCase().includes('mist')) {
      alerts.push({
        id: `visibility-${index}`,
        type: 'visibility',
        severity: 'medium',
        title: 'Low Visibility Conditions',
        description: `${day.condition} expected. May affect exterior shots and safety.`,
        date: day.date,
      });
    }
    
    // General production score alerts for scheduled days
    if (shootingDays) {
      const matchingDay = shootingDays.find(sd => {
        if (!sd.scheduledDate) return false;
        return sd.scheduledDate.split('T')[0] === day.date;
      });
      
      if (matchingDay && day.productionScore < 40) {
        alerts.push({
          id: `production-${index}`,
          type: 'general',
          severity: 'critical',
          title: `Poor Production Conditions - Day ${matchingDay.dayNumber}`,
          description: `Production score is only ${day.productionScore}%. Consider rescheduling or planning indoor scenes.`,
          date: day.date,
          affectedDay: matchingDay.dayNumber,
        });
      } else if (matchingDay && day.productionScore < 60) {
        alerts.push({
          id: `production-${index}`,
          type: 'general',
          severity: 'medium',
          title: `Moderate Production Conditions - Day ${matchingDay.dayNumber}`,
          description: `Production score is ${day.productionScore}%. Plan backup indoor scenes.`,
          date: day.date,
          affectedDay: matchingDay.dayNumber,
        });
      }
    }
  });
  
  // Sort by severity (critical first) then by date
  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  return alerts.sort((a, b) => {
    if (severityOrder[a.severity] !== severityOrder[b.severity]) {
      return severityOrder[a.severity] - severityOrder[b.severity];
    }
    return new Date(a.date).getTime() - new Date(b.date).getTime();
  });
}

function getAlertIcon(type: WeatherAlert['type']) {
  switch (type) {
    case 'thunderstorm':
      return '⛈️';
    case 'rain':
      return '🌧️';
    case 'extreme_heat':
      return '🌡️';
    case 'extreme_cold':
      return '🥶';
    case 'wind':
      return '💨';
    case 'humidity':
      return '💧';
    case 'visibility':
      return '🌫️';
    default:
      return '⚠️';
  }
}

function getSeverityColor(severity: WeatherAlert['severity']) {
  switch (severity) {
    case 'critical':
      return { bg: 'bg-red-500/20', border: 'border-red-500/50', text: 'text-red-400', badge: 'bg-red-500' };
    case 'high':
      return { bg: 'bg-orange-500/20', border: 'border-orange-500/50', text: 'text-orange-400', badge: 'bg-orange-500' };
    case 'medium':
      return { bg: 'bg-amber-500/20', border: 'border-amber-500/50', text: 'text-amber-400', badge: 'bg-amber-500' };
    case 'low':
      return { bg: 'bg-slate-500/20', border: 'border-slate-500/50', text: 'text-slate-400', badge: 'bg-slate-500' };
  }
}

export default function WeatherPage() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [hourlyData, setHourlyData] = useState<HourlyWeatherData[] | null>(null);
  const [hourlyLoading, setHourlyLoading] = useState(false);
  const [selectedHourlyDate, setSelectedHourlyDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [scheduleData, setScheduleData] = useState<ScheduleData | null>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'forecast' | 'hourly' | 'analytics' | 'schedule' | 'alerts'>('forecast');
  const [showCustomLocation, setShowCustomLocation] = useState(false);
  const [customLocationInput, setCustomLocationInput] = useState('');
  const [customLocationLoading, setCustomLocationLoading] = useState(false);
  const [customLocationError, setCustomLocationError] = useState<string | null>(null);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [showPrintMenu, setShowPrintMenu] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30); // seconds
  const [filters, setFilters] = useState({
    condition: 'all',
    dateRange: 'all',
  });
  const [sortBy, setSortBy] = useState<'date' | 'temp' | 'score' | 'humidity' | 'wind'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const printMenuRef = useRef<HTMLDivElement>(null);
  const filterPanelRef = useRef<HTMLDivElement>(null);

  // Calculate active filter count (includes sort)
  const activeFilterCount = (filters.condition !== 'all' ? 1 : 0) + 
    (filters.dateRange !== 'all' ? 1 : 0) + 
    (sortBy !== 'date' || sortOrder !== 'asc' ? 1 : 0);

  // Toggle sort order
  const toggleSortOrder = useCallback(() => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  }, []);

  // Clear filters and sort
  const clearFilters = useCallback(() => {
    setFilters({ condition: 'all', dateRange: 'all' });
    setSortBy('date');
    setSortOrder('asc');
  }, []);

  // Refs for keyboard shortcuts (to avoid dependency issues)
  const clearFiltersRef = useRef(() => {})
  const activeFilterCountRef = useRef(0)
  const autoRefreshRef = useRef(autoRefresh)
  const autoRefreshIntervalRef = useRef(autoRefreshInterval)

  // Keep refs in sync with state for keyboard shortcuts
  useEffect(() => {
    activeFilterCountRef.current = activeFilterCount
  }, [activeFilterCount])

  useEffect(() => {
    clearFiltersRef.current = clearFilters
  }, [clearFilters])

  useEffect(() => {
    autoRefreshRef.current = autoRefresh
  }, [autoRefresh])

  useEffect(() => {
    autoRefreshIntervalRef.current = autoRefreshInterval
  }, [autoRefreshInterval])

  // Filtered and sorted weather forecast
  const filteredForecast = useMemo(() => {
    if (!weatherData?.forecast) return [];
    
    let result = [...weatherData.forecast];
    
    // Filter by condition
    if (filters.condition !== 'all') {
      result = result.filter(day => day.condition.toLowerCase().includes(filters.condition));
    }
    
    // Filter by date range
    if (filters.dateRange !== 'all') {
      if (filters.dateRange === '3') {
        result = result.slice(0, 3);
      } else if (filters.dateRange === '5') {
        result = result.slice(0, 5);
      } else if (filters.dateRange === 'weekend') {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
        const saturday = new Date(today);
        saturday.setDate(today.getDate() + daysUntilSaturday);
        const sunday = new Date(saturday);
        sunday.setDate(saturday.getDate() + 1);
        
        result = result.filter(day => {
          const dayDate = new Date(day.date);
          return dayDate.getDay() === 6 || dayDate.getDay() === 0;
        });
      }
    }
    
    // Apply sorting
    if (sortBy !== 'date' || sortOrder !== 'asc') {
      result.sort((a, b) => {
        let comparison = 0;
        switch (sortBy) {
          case 'date':
            comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
            break;
          case 'temp':
            comparison = a.tempHigh - b.tempHigh;
            break;
          case 'score':
            comparison = a.productionScore - b.productionScore;
            break;
          case 'humidity':
            comparison = a.humidity - b.humidity;
            break;
          case 'wind':
            comparison = a.windSpeed - b.windSpeed;
            break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }
    
    return result;
  }, [weatherData?.forecast, filters, sortBy, sortOrder]);

  // Refs for keyboard shortcuts
  const searchInputRef = useRef<HTMLInputElement>(null);
  const refreshWeatherRef = useRef<() => void>(() => {});
  const exportToCSVRef = useRef<() => void>(() => {});
  const exportToJSONRef = useRef<() => void>(() => {});
  const exportToMarkdownRef = useRef<() => void>(() => {});
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const handlePrintRef = useRef<() => void>(() => {});
  const printingRef = useRef(false);
  // Refs for filters to avoid dependency issues in keyboard shortcuts
  const filtersRef = useRef(filters);
  const sortByRef = useRef(sortBy);
  const sortOrderRef = useRef(sortOrder);
  // Refs for context-aware keyboard shortcuts
  const showFiltersRef = useRef(showFilters);
  const viewModeRef = useRef(viewMode);
  const filterConditionRef = useRef(filters.condition);

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
      setLastUpdated(new Date());
    }
  }, []);

  const fetchHourlyWeather = useCallback(async (location: Location, date: string) => {
    setHourlyLoading(true);
    try {
      const params = new URLSearchParams({
        lat: String(location.lat),
        lng: String(location.lng),
        location: location.name,
        type: 'hourly',
        date: date,
      });
      const res = await fetch(`/api/weather?${params}`);
      const data = await res.json();

      if (!res.ok) {
        console.error('Failed to fetch hourly weather:', data.error);
        setHourlyData(null);
        return;
      }

      setHourlyData(data.hourly || []);
    } catch (e) {
      console.error('Failed to fetch hourly weather:', e);
      setHourlyData(null);
    } finally {
      setHourlyLoading(false);
    }
  }, []);

  const refreshWeather = useCallback(() => {
    if (selectedLocation) {
      setRefreshing(true);
      fetchWeather(selectedLocation).finally(() => setRefreshing(false));
    }
  }, [selectedLocation, fetchWeather]);

  // Set up refresh ref for keyboard shortcuts
  useEffect(() => {
    refreshWeatherRef.current = refreshWeather;
  }, [refreshWeather]);

  // Auto-refresh effect
  useEffect(() => {
    if (!autoRefresh) return;
    
    const intervalId = setInterval(() => {
      setRefreshing(true);
      if (selectedLocation) {
        fetchWeather(selectedLocation);
      }
    }, autoRefreshInterval * 1000);
    
    return () => clearInterval(intervalId);
  }, [autoRefresh, autoRefreshInterval, selectedLocation, fetchWeather]);

  // Keep filter refs in sync with state
  useEffect(() => {
    filtersRef.current = filters;
  }, [filters]);

  useEffect(() => {
    sortByRef.current = sortBy;
  }, [sortBy]);

  useEffect(() => {
    sortOrderRef.current = sortOrder;
  }, [sortOrder]);

  useEffect(() => {
    showFiltersRef.current = showFilters;
  }, [showFilters]);

  useEffect(() => {
    viewModeRef.current = viewMode;
  }, [viewMode]);

  useEffect(() => {
    filterConditionRef.current = filters.condition;
  }, [filters.condition]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if typing in input/textarea/select
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) {
        return
      }
      
      switch (e.key.toLowerCase()) {
        case 'r':
          e.preventDefault()
          refreshWeatherRef.current()
          break
        case 'a':
          e.preventDefault()
          setAutoRefresh(prev => !prev)
          break
        case '/':
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        case '1':
          e.preventDefault()
          if (showFiltersRef.current) {
            // Filter by condition: sunny
            const conditions = ['sunny', 'partly_cloudy', 'cloudy', 'rain', 'thunderstorm']
            setFilters(prev => ({
              ...prev,
              condition: prev.condition === conditions[0] ? 'all' : conditions[0]
            }))
          } else {
            setViewMode('forecast')
          }
          break
        case '2':
          e.preventDefault()
          if (showFiltersRef.current) {
            // Filter by condition: partly_cloudy
            const conditions = ['sunny', 'partly_cloudy', 'cloudy', 'rain', 'thunderstorm']
            setFilters(prev => ({
              ...prev,
              condition: prev.condition === conditions[1] ? 'all' : conditions[1]
            }))
          } else {
            setViewMode('hourly')
          }
          break
        case '3':
          e.preventDefault()
          if (showFiltersRef.current) {
            // Filter by condition: cloudy
            const conditions = ['sunny', 'partly_cloudy', 'cloudy', 'rain', 'thunderstorm']
            setFilters(prev => ({
              ...prev,
              condition: prev.condition === conditions[2] ? 'all' : conditions[2]
            }))
          } else {
            setViewMode('analytics')
          }
          break
        case '4':
          e.preventDefault()
          if (showFiltersRef.current) {
            // Filter by condition: rain
            const conditions = ['sunny', 'partly_cloudy', 'cloudy', 'rain', 'thunderstorm']
            setFilters(prev => ({
              ...prev,
              condition: prev.condition === conditions[3] ? 'all' : conditions[3]
            }))
          } else {
            setViewMode('schedule')
          }
          break
        case '5':
          e.preventDefault()
          if (showFiltersRef.current) {
            // Filter by condition: thunderstorm
            const conditions = ['sunny', 'partly_cloudy', 'cloudy', 'rain', 'thunderstorm']
            setFilters(prev => ({
              ...prev,
              condition: prev.condition === conditions[4] ? 'all' : conditions[4]
            }))
          } else {
            setViewMode('alerts')
          }
          break
        // Number key 0 clears filter (when filters open)
        case '0':
          if (!e.shiftKey) {
            e.preventDefault()
            if (showFiltersRef.current) {
              setFilters(prev => ({ ...prev, condition: 'all' }))
            }
          }
          break
        case '6':
          if (!e.shiftKey) {
            e.preventDefault()
            if (showFiltersRef.current) {
              // Already in filter mode, toggle sunny (same as key 1)
              const conditions = ['sunny', 'partly_cloudy', 'cloudy', 'rain', 'thunderstorm']
              setFilters(prev => ({
                ...prev,
                condition: prev.condition === conditions[0] ? 'all' : conditions[0]
              }))
            } else {
              // Open filters panel first
              setShowFilters(true)
            }
          }
          break
        case '7':
          if (!e.shiftKey) {
            e.preventDefault()
            if (showFiltersRef.current) {
              const conditions = ['sunny', 'partly_cloudy', 'cloudy', 'rain', 'thunderstorm']
              setFilters(prev => ({
                ...prev,
                condition: prev.condition === conditions[1] ? 'all' : conditions[1]
              }))
            } else {
              setShowFilters(true)
            }
          }
          break
        case '8':
          if (!e.shiftKey) {
            e.preventDefault()
            if (showFiltersRef.current) {
              const conditions = ['sunny', 'partly_cloudy', 'cloudy', 'rain', 'thunderstorm']
              setFilters(prev => ({
                ...prev,
                condition: prev.condition === conditions[2] ? 'all' : conditions[2]
              }))
            } else {
              setShowFilters(true)
            }
          }
          break
        case '9':
          if (!e.shiftKey) {
            e.preventDefault()
            if (showFiltersRef.current) {
              const conditions = ['sunny', 'partly_cloudy', 'cloudy', 'rain', 'thunderstorm']
              setFilters(prev => ({
                ...prev,
                condition: prev.condition === conditions[3] ? 'all' : conditions[3]
              }))
            } else {
              setShowFilters(true)
            }
          }
          break
        case 'f':
          e.preventDefault()
          setShowFilters(prev => !prev)
          break
        case 's':
          e.preventDefault()
          toggleSortOrder()
          break
        // Shift+number for date range filter (only when filters open)
        case 'Shift':
          // Handled in the key press, not here
          break
        // Date range filter with Shift+number (only when filters open)
        default:
          if (e.shiftKey && ['1', '2', '3', '4', '0'].includes(e.key)) {
            e.preventDefault()
            if (showFiltersRef.current) {
              const dateRanges: Record<string, string> = {
                '1': '3',
                '2': '5',
                '3': 'weekend',
                '4': 'all',
                '0': 'all'
              }
              const newRange = dateRanges[e.key]
              if (newRange === 'all') {
                setFilters(prev => ({ ...prev, dateRange: 'all' }))
              } else {
                setFilters(prev => ({ ...prev, dateRange: newRange }))
              }
            }
          }
          break
        case 'e':
          e.preventDefault()
          if (weatherData?.forecast?.length) {
            setShowExportMenu(prev => !prev)
          }
          break
        case '?':
          e.preventDefault()
          setShowKeyboardHelp(true)
          break
        case 'escape':
          e.preventDefault()
          setShowKeyboardHelp(false)
          setShowExportMenu(false)
          setShowPrintMenu(false)
          setShowFilters(false)
          break
        case 'f':
          e.preventDefault()
          setShowFilters(prev => !prev)
          break
        case 's':
          e.preventDefault()
          toggleSortOrder()
          break
        case 'x':
          if (!e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            if (showFiltersRef.current && activeFilterCountRef.current > 0) {
              clearFiltersRef.current()
            }
          }
          break
        case 'p':
          e.preventDefault()
          if (weatherData?.forecast?.length && !printingRef.current) {
            handlePrintRef.current()
          }
          break
        case 'm':
          e.preventDefault()
          if (weatherData?.forecast?.length) {
            exportToMarkdownRef.current()
          }
          break
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [weatherData, toggleSortOrder]);

  // Geocode custom location using Nominatim (free API)
  const handleCustomLocationSearch = useCallback(async () => {
    if (!customLocationInput.trim()) return;
    
    setCustomLocationLoading(true);
    setCustomLocationError(null);
    
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(customLocationInput)}&limit=1`,
        { headers: { 'User-Agent': 'CinePilot/1.0' } }
      );
      const data = await res.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const newLocation: Location = {
          name: result.display_name.split(',')[0] || customLocationInput,
          lat: parseFloat(result.lat),
          lng: parseFloat(result.lon),
        };
        
        // Add to LOCATIONS if not already present
        const exists = LOCATIONS.some(l => l.name === newLocation.name);
        if (!exists) {
          (LOCATIONS as Location[]).push(newLocation);
        }
        
        setSelectedLocation(newLocation);
        fetchWeather(newLocation);
        setShowCustomLocation(false);
        setCustomLocationInput('');
      } else {
        setCustomLocationError('Location not found. Try a different search term.');
      }
    } catch (e) {
      setCustomLocationError('Failed to search location. Please try again.');
    } finally {
      setCustomLocationLoading(false);
    }
  }, [customLocationInput, fetchWeather]);

  // Export forecast to CSV (uses filtered/sorted data)
  const exportToCSV = useCallback(() => {
    if (!filteredForecast.length) return;
    
    const headers = ['Date', 'Condition', 'Temp High (°C)', 'Temp Low (°C)', 'Humidity (%)', 'Wind Speed (km/h)', 'Precipitation (mm)', 'Production Score', 'Recommendation'];
    const rows = filteredForecast.map(day => [
      day.date,
      day.condition,
      day.tempHigh.toString(),
      day.tempLow.toString(),
      day.humidity.toString(),
      day.windSpeed.toString(),
      day.precipitation.toString(),
      day.productionScore.toString(),
      day.recommendation,
    ]);
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather-forecast-${weatherData?.location || 'forecast'}-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredForecast, weatherData]);

  // Export forecast to JSON (uses filtered/sorted data)
  const exportToJSON = useCallback(() => {
    if (!filteredForecast.length) return;
    
    const exportData = {
      exportDate: new Date().toISOString(),
      location: weatherData?.location || 'Unknown',
      coordinates: { lat: weatherData?.lat || 0, lng: weatherData?.lng || 0 },
      isDemo: weatherData?.isDemo,
      filters: {
        condition: filters.condition,
        dateRange: filters.dateRange,
        sortBy,
        sortOrder,
      },
      summary: {
        totalDays: filteredForecast.length,
        avgProductionScore: Math.round(filteredForecast.reduce((sum, d) => sum + d.productionScore, 0) / filteredForecast.length),
        bestDay: filteredForecast.reduce((best, d) => d.productionScore > best.productionScore ? d : best, filteredForecast[0]),
        worstDay: filteredForecast.reduce((worst, d) => d.productionScore < worst.productionScore ? d : worst, filteredForecast[0]),
        totalPrecipitation: filteredForecast.reduce((sum, d) => sum + d.precipitation, 0),
      },
      forecast: filteredForecast.map(day => ({
        date: day.date,
        condition: day.condition,
        temperature: { high: day.tempHigh, low: day.tempLow },
        humidity: day.humidity,
        windSpeed: day.windSpeed,
        precipitation: day.precipitation,
        productionScore: day.productionScore,
        recommendation: day.recommendation,
      })),
    };
    
    const json = JSON.stringify(exportData, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather-forecast-${weatherData?.location || 'forecast'}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredForecast, weatherData, filters, sortBy, sortOrder]);

  // Export forecast to Markdown (uses filtered/sorted data)
  const exportToMarkdown = useCallback(() => {
    if (!filteredForecast.length) return;
    
    const forecast = filteredForecast;
    const avgScore = Math.round(forecast.reduce((sum, d) => sum + d.productionScore, 0) / forecast.length);
    const bestDay = forecast.reduce((best, d) => d.productionScore > best.productionScore ? d : best, forecast[0]);
    const worstDay = forecast.reduce((worst, d) => d.productionScore < worst.productionScore ? d : worst, forecast[0]);
    const totalPrecip = forecast.reduce((sum, d) => sum + d.precipitation, 0);
    
    // Calculate condition breakdown
    const conditions = forecast.reduce((acc, day) => {
      const cond = day.condition;
      acc[cond] = (acc[cond] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Get score distribution
    const goodDays = forecast.filter(d => d.productionScore >= 80).length;
    const moderateDays = forecast.filter(d => d.productionScore >= 60 && d.productionScore < 80).length;
    const badDays = forecast.filter(d => d.productionScore < 60).length;
    
    const getScoreLabel = (score: number) => {
      if (score >= 80) return '🟢 Excellent';
      if (score >= 60) return '🟡 Good';
      return '🔴 Poor';
    };
    
    const getConditionEmoji = (condition: string) => {
      const c = condition.toLowerCase();
      if (c.includes('rain')) return '🌧️';
      if (c.includes('cloud')) return '☁️';
      if (c.includes('thunder')) return '⛈️';
      if (c.includes('clear') || c.includes('sun')) return '☀️';
      return '🌤️';
    };
    
    let markdown = `# Weather Forecast - CinePilot

## Executive Summary

| Metric | Value |
|--------|-------|
| **Location** | ${weatherData?.location || 'Unknown'} |
| **Coordinates** | ${weatherData?.lat?.toFixed(2) || '0'}, ${weatherData?.lng?.toFixed(2) || '0'} |
| **Total Days** | ${forecast.length} |
| **Average Score** | ${avgScore}/100 |
| **Best Day** | ${bestDay.date} (${bestDay.productionScore}/100) |
| **Worst Day** | ${worstDay.date} (${worstDay.productionScore}/100) |
| **Total Precipitation** | ${totalPrecip.toFixed(1)} mm |

## Production Score Distribution

| Rating | Days | Percentage |
|--------|------|------------|
| 🟢 Excellent (80-100) | ${goodDays} | ${Math.round((goodDays / forecast.length) * 100)}% |
| 🟡 Good (60-79) | ${moderateDays} | ${Math.round((moderateDays / forecast.length) * 100)}% |
| 🔴 Poor (<60) | ${badDays} | ${Math.round((badDays / forecast.length) * 100)}% |

## Condition Breakdown

`;
    
    // Add condition breakdown table
    markdown += `| Condition | Days | Percentage |\n|------------|------|------------|\n`;
    Object.entries(conditions).forEach(([cond, count]) => {
      markdown += `| ${getConditionEmoji(cond)} ${cond} | ${count} | ${Math.round((count / forecast.length) * 100)}% |\n`;
    });
    
    markdown += `
## Daily Forecast

| Date | Condition | Temp (°C) | Humidity | Wind | Precip | Score | Recommendation |
|------|-----------|-----------|----------|------|--------|-------|----------------|
`;
    
    forecast.forEach(day => {
      markdown += `| ${day.date} | ${getConditionEmoji(day.condition)} ${day.condition} | ${day.tempHigh}°/${day.tempLow}° | ${day.humidity}% | ${day.windSpeed} km/h | ${day.precipitation} mm | ${getScoreLabel(day.productionScore)} | ${day.recommendation} |\n`;
    });
    
    // Add filters info if active
    const activeFilters = [];
    if (filters.condition !== 'all') activeFilters.push(`Condition: ${filters.condition}`);
    if (filters.dateRange !== 'all') activeFilters.push(`Date Range: ${filters.dateRange}`);
    if (sortBy !== 'date' || sortOrder !== 'asc') activeFilters.push(`Sort: ${sortBy} (${sortOrder})`);
    
    if (activeFilters.length > 0) {
      markdown += `
## Filters Applied

- ${activeFilters.join('\n- ')}

`;
    }
    
    markdown += `
---
*Generated by CinePilot on ${new Date().toLocaleString()}*
`;
    
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `weather-forecast-${weatherData?.location || 'forecast'}-${new Date().toISOString().split('T')[0]}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filteredForecast, weatherData, filters, sortBy, sortOrder]);

  // Set up export ref for keyboard shortcuts
  useEffect(() => {
    exportToCSVRef.current = exportToCSV;
    exportToJSONRef.current = exportToJSON;
    exportToMarkdownRef.current = exportToMarkdown;
  }, [exportToCSV, exportToJSON, exportToMarkdown]);

  // Print forecast report
  const handlePrint = useCallback(() => {
    if (!filteredForecast.length) return;
    setPrinting(true);
    setShowPrintMenu(false);
    
    const forecast = filteredForecast;
    const avgScore = Math.round(forecast.reduce((sum, d) => sum + d.productionScore, 0) / forecast.length);
    const bestDay = forecast.reduce((best, d) => d.productionScore > best.productionScore ? d : best, forecast[0]);
    const totalPrecip = forecast.reduce((sum, d) => sum + d.precipitation, 0);
    
    const getConditionColor = (condition: string) => {
      const c = condition.toLowerCase();
      if (c.includes('sun') || c.includes('clear')) return '#22c55e';
      if (c.includes('cloud')) return '#94a3b8';
      if (c.includes('rain')) return '#3b82f6';
      if (c.includes('storm')) return '#8b5cf6';
      return '#64748b';
    };
    
    const getScoreColor = (score: number) => {
      if (score >= 80) return '#22c55e';
      if (score >= 60) return '#eab308';
      return '#ef4444';
    };
    
    const printContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Weather Forecast - CinePilot</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1e293b; }
    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
    .header h1 { font-size: 28px; color: #1e293b; margin-bottom: 5px; }
    .header .location { color: #64748b; font-size: 16px; }
    .header .date { color: #94a3b8; font-size: 12px; margin-top: 5px; }
    .stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 30px; }
    .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 15px; text-align: center; }
    .stat-card .label { font-size: 11px; color: #64748b; text-transform: uppercase; }
    .stat-card .value { font-size: 20px; font-weight: bold; color: #1e293b; }
    .stat-card .value.green { color: #22c55e; }
    .stat-card .value.yellow { color: #eab308; }
    .stat-card .value.blue { color: #3b82f6; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
    th, td { padding: 10px 8px; text-align: center; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    th { background: #f1f5f9; font-weight: 600; color: #475569; }
    th:first-child, td:first-child { text-align: left; }
    .condition { display: flex; align-items: center; gap: 8px; }
    .condition-dot { width: 10px; height: 10px; border-radius: 50%; }
    .score { font-weight: bold; }
    .score.high { color: #22c55e; }
    .score.medium { color: #eab308; }
    .score.low { color: #ef4444; }
    .recommendation { font-size: 10px; color: #64748b; max-width: 150px; }
    .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 12px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>Weather Forecast Report</h1>
    <div class="location">📍 ${weatherData?.location || 'Unknown Location'}</div>
    <div class="date">Generated: ${new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
  </div>
  
  <div class="stats">
    <div class="stat-card">
      <div class="label">Forecast Days</div>
      <div class="value">${forecast.length}</div>
    </div>
    <div class="stat-card">
      <div class="label">Avg Score</div>
      <div class="value ${avgScore >= 80 ? 'green' : avgScore >= 60 ? 'yellow' : ''}">${avgScore}%</div>
    </div>
    <div class="stat-card">
      <div class="label">Best Day</div>
      <div class="value green">${bestDay.date}</div>
    </div>
    <div class="stat-card">
      <div class="label">Total Rain</div>
      <div class="value blue">${totalPrecip.toFixed(1)}mm</div>
    </div>
  </div>
  
  <table>
    <thead>
      <tr>
        <th>Date</th>
        <th>Condition</th>
        <th>High</th>
        <th>Low</th>
        <th>Humidity</th>
        <th>Wind</th>
        <th>Rain</th>
        <th>Score</th>
        <th>Recommendation</th>
      </tr>
    </thead>
    <tbody>
      ${forecast.map(day => `
      <tr>
        <td>${day.date}</td>
        <td>
          <div class="condition">
            <div class="condition-dot" style="background: ${getConditionColor(day.condition)}"></div>
            ${day.condition}
          </div>
        </td>
        <td>${day.tempHigh}°C</td>
        <td>${day.tempLow}°C</td>
        <td>${day.humidity}%</td>
        <td>${day.windSpeed} km/h</td>
        <td>${day.precipitation}mm</td>
        <td><span class="score ${day.productionScore >= 80 ? 'high' : day.productionScore >= 60 ? 'medium' : 'low'}">${day.productionScore}%</span></td>
        <td><div class="recommendation">${day.recommendation}</div></td>
      </tr>
      `).join('')}
    </tbody>
  </table>
  
  <div class="footer">
    <p>CinePilot - Production Weather Forecasting</p>
  </div>
</body>
</html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
      };
    }
    
    setTimeout(() => setPrinting(false), 500);
  }, [filteredForecast, weatherData]);

  // Set up print ref for keyboard shortcuts (after handlePrint is defined)
  useEffect(() => {
    handlePrintRef.current = handlePrint;
    printingRef.current = printing;
  }, [handlePrint, printing]);

  // Click outside to close export menu
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (showExportMenu && exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setShowExportMenu(false);
      }
      if (showPrintMenu && printMenuRef.current && !printMenuRef.current.contains(e.target as Node)) {
        setShowPrintMenu(false);
      }
      if (showFilters && filterPanelRef.current && !filterPanelRef.current.contains(e.target as Node)) {
        setShowFilters(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showExportMenu, showPrintMenu, showFilters]);

  // Fetch hourly data when switching to hourly view
  useEffect(() => {
    if (viewMode === 'hourly' && selectedLocation && weatherData?.forecast?.length) {
      // Check if selected date is in the forecast
      const dateInForecast = weatherData.forecast.find(d => d.date === selectedHourlyDate);
      if (dateInForecast) {
        fetchHourlyWeather(selectedLocation, selectedHourlyDate);
      } else if (weatherData.forecast[0]) {
        // Default to first available date
        setSelectedHourlyDate(weatherData.forecast[0].date);
        fetchHourlyWeather(selectedLocation, weatherData.forecast[0].date);
      }
    }
  }, [viewMode, selectedLocation, selectedHourlyDate, weatherData?.forecast, fetchHourlyWeather]);

  // Fetch hourly data when date changes
  useEffect(() => {
    if (viewMode === 'hourly' && selectedLocation && selectedHourlyDate) {
      fetchHourlyWeather(selectedLocation, selectedHourlyDate);
    }
  }, [selectedHourlyDate, viewMode, selectedLocation, fetchHourlyWeather]);

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

    // Humidity data for production impact
    const humidityData = forecast.map((d) => ({
      date: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }),
      humidity: d.humidity,
      impact: d.humidity > 85 ? 3 : d.humidity > 75 ? 2 : 1, // 1=good, 2=moderate, 3=challenging
    }));

    // Wind data for production impact
    const windData = forecast.map((d) => ({
      date: new Date(d.date).toLocaleDateString('en-IN', { weekday: 'short' }),
      wind: d.windSpeed,
      impact: d.windSpeed > 30 ? 3 : d.windSpeed > 20 ? 2 : 1, // 1=good, 2=moderate, 3=challenging
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
      humidityData,
      windData,
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

        {/* Keyboard Help Modal */}
        {showKeyboardHelp && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50" onClick={() => setShowKeyboardHelp(false)}>
            <div className="bg-slate-900 border border-white/20 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">Keyboard Shortcuts</h2>
                <button 
                  onClick={() => setShowKeyboardHelp(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5 text-slate-400" />
                </button>
              </div>
              <div className="space-y-3">
                <ShortcutRow keys={['R']} description="Refresh weather data" />
                <ShortcutRow keys={['A']} description="Toggle auto-refresh" />
                <ShortcutRow keys={['/']} description="Search locations" />
                <div className="pt-2 pb-1 border-t border-white/10">
                  <span className="text-xs text-amber-400 font-medium">When Filters Closed</span>
                </div>
                <ShortcutRow keys={['1']} description="Switch to Forecast view" />
                <ShortcutRow keys={['2']} description="Switch to Hourly view" />
                <ShortcutRow keys={['3']} description="Switch to Analytics view" />
                <ShortcutRow keys={['4']} description="Switch to Schedule view" />
                <ShortcutRow keys={['5']} description="Switch to Alerts view" />
                <ShortcutRow keys={['6-9']} description="Open filter panel" />
                <div className="pt-2 pb-1 border-t border-white/10">
                  <span className="text-xs text-cyan-400 font-medium">When Filters Open</span>
                </div>
                <ShortcutRow keys={['1']} description="Filter by Sunny (toggle)" />
                <ShortcutRow keys={['2']} description="Filter by Partly Cloudy (toggle)" />
                <ShortcutRow keys={['3']} description="Filter by Cloudy (toggle)" />
                <ShortcutRow keys={['4']} description="Filter by Rain (toggle)" />
                <ShortcutRow keys={['5']} description="Filter by Thunderstorm (toggle)" />
                <ShortcutRow keys={['0']} description="Clear condition filter" />
                <ShortcutRow keys={['6-9']} description="Quick filter by condition" />
                <ShortcutRow keys={['⇧1']} description="Filter: Next 3 Days" />
                <ShortcutRow keys={['⇧2']} description="Filter: Next 5 Days" />
                <ShortcutRow keys={['⇧3']} description="Filter: This Weekend" />
                <ShortcutRow keys={['⇧0']} description="Clear date range filter" />
                <div className="pt-2 pb-1 border-t border-white/10">
                  <span className="text-xs text-emerald-400 font-medium">General</span>
                </div>
                <ShortcutRow keys={['F']} description="Toggle filters panel" />
                <ShortcutRow keys={['S']} description="Toggle sort order" />
                <ShortcutRow keys={['X']} description="Clear all filters" />
                <ShortcutRow keys={['E']} description="Toggle export menu" />
                <ShortcutRow keys={['M']} description="Export Markdown" />
                <ShortcutRow keys={['P']} description="Print forecast report" />
                <ShortcutRow keys={['?']} description="Show keyboard shortcuts" />
                <ShortcutRow keys={['Esc']} description="Close modal" />
              </div>
              <div className="mt-6 pt-4 border-t border-white/10">
                <p className="text-xs text-slate-500 text-center">Press the keys to trigger actions</p>
              </div>
            </div>
          </div>
        )}

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
            {lastUpdated && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-lg">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="text-slate-400 text-xs">
                  {autoRefresh && <span className="flex items-center gap-1 text-emerald-400 mr-2"><span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>Auto: {autoRefreshInterval}s</span>}
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              </div>
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
                    onClick={() => setViewMode('hourly')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-all ${
                      viewMode === 'hourly'
                        ? 'bg-blue-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Hourly
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
                  <button
                    onClick={() => setViewMode('alerts')}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-all flex items-center gap-1.5 ${
                      viewMode === 'alerts'
                        ? 'bg-red-500 text-white'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    Alerts
                    {weatherData && (() => {
                      const alerts = generateWeatherAlerts(weatherData.forecast, scheduleData?.shootingDays || scheduleData?.days);
                      const criticalCount = alerts.filter(a => a.severity === 'critical' || a.severity === 'high').length;
                      return criticalCount > 0 ? (
                        <span className="ml-1 px-1.5 py-0.5 text-xs rounded-full bg-red-500 text-white">
                          {criticalCount}
                        </span>
                      ) : null;
                    })()}
                  </button>
                </div>
                <button
                  onClick={refreshWeather}
                  disabled={loading || refreshing || autoRefresh}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 disabled:opacity-50 transition-colors"
                  title="Refresh (R)"
                >
                  {loading || refreshing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  Refresh
                </button>
                {/* Auto-refresh toggle */}
                <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2">
                  <button
                    onClick={() => setAutoRefresh(!autoRefresh)}
                    className={`flex items-center gap-2 text-sm transition-colors ${
                      autoRefresh ? 'text-emerald-400' : 'text-slate-400 hover:text-slate-300'
                    }`}
                    title="Toggle auto-refresh"
                  >
                    <div className={`w-8 h-4 rounded-full transition-colors relative ${
                      autoRefresh ? 'bg-emerald-500' : 'bg-slate-600'
                    }`}>
                      <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-transform ${
                        autoRefresh ? 'left-4.5 translate-x-0' : 'left-0.5'
                      }`} style={{ left: autoRefresh ? '18px' : '2px' }} />
                    </div>
                  </button>
                  {autoRefresh && (
                    <select
                      value={autoRefreshInterval}
                      onChange={(e) => setAutoRefreshInterval(Number(e.target.value))}
                      className="bg-slate-700 border border-slate-600 rounded px-2 py-1 text-xs text-white"
                    >
                      <option value={10}>10s</option>
                      <option value={30}>30s</option>
                      <option value={60}>1m</option>
                      <option value={300}>5m</option>
                    </select>
                  )}
                </div>
                {/* Filter Toggle Button */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-4 py-2.5 rounded-lg text-sm flex items-center gap-2 transition-colors ${
                    showFilters 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-700 hover:bg-slate-600 text-slate-300'
                  }`}
                  title="Toggle Filters (F)"
                >
                  <Filter className="w-4 h-4" />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 bg-blue-500 text-white text-xs rounded-full">{activeFilterCount}</span>
                  )}
                </button>
                <button
                  onClick={exportToCSV}
                  disabled={!weatherData?.forecast?.length}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50 transition-colors"
                  title="Export CSV (E)"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
                <div className="relative" ref={exportMenuRef}>
                  <button
                    onClick={() => setShowExportMenu(!showExportMenu)}
                    disabled={!weatherData?.forecast?.length}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-50 transition-colors"
                    title="Export menu (E)"
                  >
                    <Download className="w-4 h-4" />
                    Export
                    <ChevronDown className={`w-3 h-3 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                  </button>
                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                      <button
                        onClick={() => { exportToCSV(); setShowExportMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-200 hover:bg-slate-700 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-emerald-400" />
                        <div>
                          <div className="font-medium">Export as CSV</div>
                          <div className="text-xs text-slate-500">Spreadsheet format</div>
                        </div>
                      </button>
                      <button
                        onClick={() => { exportToJSON(); setShowExportMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-200 hover:bg-slate-700 transition-colors border-t border-slate-700"
                      >
                        <FileJson className="w-4 h-4 text-purple-400" />
                        <div>
                          <div className="font-medium">Export as JSON</div>
                          <div className="text-xs text-slate-500">Full data with summary</div>
                        </div>
                      </button>
                      <button
                        onClick={() => { exportToMarkdown(); setShowExportMenu(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-200 hover:bg-slate-700 transition-colors border-t border-slate-700"
                      >
                        <FileText className="w-4 h-4 text-cyan-400" />
                        <div>
                          <div className="font-medium">Export as Markdown</div>
                          <div className="text-xs text-slate-500">Formatted report</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
                {/* Print Button */}
                <div className="relative" ref={printMenuRef}>
                  <button
                    onClick={() => setShowPrintMenu(!showPrintMenu)}
                    disabled={!weatherData?.forecast?.length || printing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50 transition-colors"
                    title="Print forecast (P)"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                  {showPrintMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-50 overflow-hidden">
                      <button
                        onClick={handlePrint}
                        disabled={!weatherData?.forecast?.length}
                        className="w-full flex items-center gap-3 px-4 py-3 text-left text-slate-200 hover:bg-slate-700 transition-colors disabled:opacity-50"
                      >
                        <Printer className="w-4 h-4 text-amber-400" />
                        <div>
                          <div className="font-medium">Print Forecast</div>
                          <div className="text-xs text-slate-500">Formatted report</div>
                        </div>
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => searchInputRef.current?.focus()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Search (/)"
                >
                  <Search className="w-4 h-4" />
                  <span className="text-sm">Search</span>
                </button>
                <button
                  onClick={() => setShowKeyboardHelp(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
                  title="Keyboard shortcuts (?)"
                >
                  <HelpCircle className="w-4 h-4" />
                </button>
              </>
            )}
            <button
              onClick={() => setShowCustomLocation(!showCustomLocation)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Custom Location
            </button>
          </div>
        </div>

        {/* Filter & Sort Panel */}
        {showFilters && weatherData?.forecast && (
          <div 
            ref={filterPanelRef}
            className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6 animate-in fade-in slide-in-from-top-2 duration-200"
          >
            {/* Filters Row */}
            <div className="flex flex-wrap items-center gap-4 mb-3">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-blue-400" />
                <span className="text-sm font-medium text-slate-300">Filters:</span>
                <span className="text-xs text-cyan-400">(1-5 for condition, 0 to clear, ⇧1-3 for date)</span>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Condition:</label>
                <select
                  value={filters.condition}
                  onChange={(e) => setFilters(prev => ({ ...prev, condition: e.target.value }))}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Conditions (0)</option>
                  <option value="sunny">☀️ Sunny (6)</option>
                  <option value="partly_cloudy">⛅ Partly Cloudy (7)</option>
                  <option value="cloudy">☁️ Cloudy (8)</option>
                  <option value="rain">🌧️ Rain (9)</option>
                  <option value="thunderstorm">⛈️ Thunderstorm</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm text-slate-400">Date Range:</label>
                <select
                  value={filters.dateRange}
                  onChange={(e) => setFilters(prev => ({ ...prev, dateRange: e.target.value }))}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="all">All Days (⇧0)</option>
                  <option value="3">Next 3 Days (⇧1)</option>
                  <option value="5">Next 5 Days (⇧2)</option>
                  <option value="weekend">This Weekend (⇧3)</option>
                </select>
              </div>
            </div>
            {/* Sort Row */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-blue-300">Sort:</span>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="bg-slate-700 border border-slate-600 rounded-lg px-3 py-1.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                >
                  <option value="date">📅 Date</option>
                  <option value="temp">🌡️ Temperature</option>
                  <option value="score">🎯 Production Score</option>
                  <option value="humidity">💧 Humidity</option>
                  <option value="wind">💨 Wind Speed</option>
                </select>
              </div>
              <button
                onClick={toggleSortOrder}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  sortOrder === 'asc' 
                    ? 'bg-blue-600 text-white hover:bg-blue-500' 
                    : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                }`}
              >
                {sortOrder === 'asc' ? '↑ ASC' : '↓ DESC'}
              </button>
              {activeFilterCount > 0 && (
                <button
                  onClick={clearFilters}
                  className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                >
                  Clear All
                </button>
              )}
              <span className="text-sm text-slate-500 ml-auto">
                {filteredForecast.length} of {weatherData.forecast.length} days
              </span>
            </div>
          </div>
        )}

        {/* Custom Location Input */}
        {showCustomLocation && (
          <div className="mb-6 p-4 bg-slate-900 border border-slate-700 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={customLocationInput}
                  onChange={(e) => setCustomLocationInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCustomLocationSearch()}
                  placeholder="Enter city or location name..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-800 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>
              <button
                onClick={handleCustomLocationSearch}
                disabled={customLocationLoading || !customLocationInput.trim()}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg disabled:opacity-50 transition-colors flex items-center gap-2"
              >
                {customLocationLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </button>
              <button
                onClick={() => { setShowCustomLocation(false); setCustomLocationInput(''); setCustomLocationError(null); }}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {customLocationError && (
              <p className="mt-2 text-sm text-red-400">{customLocationError}</p>
            )}
            <p className="mt-2 text-xs text-slate-500">
              Powered by OpenStreetMap Nominatim (free geocoding)
            </p>
          </div>
        )}

        {/* Location Selection */}
        <div className="mb-6">
          {/* Search Input */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search locations... (/)"
              className="w-full pl-10 pr-16 py-2.5 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-xs bg-slate-800 text-slate-400 rounded">/</kbd>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
            {LOCATIONS.filter(loc => 
              loc.name.toLowerCase().includes(searchQuery.toLowerCase())
            ).map((loc) => (
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

            {viewMode === 'hourly' && (
              /* Hourly Forecast */
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-cyan-500/20">
                      <Clock className="w-5 h-5 text-cyan-400" />
                    </div>
                    <h2 className="text-lg font-semibold text-white">Hourly Forecast</h2>
                  </div>
                  
                  {/* Date Selector */}
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400" />
                    <select
                      value={selectedHourlyDate}
                      onChange={(e) => setSelectedHourlyDate(e.target.value)}
                      className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-cyan-500"
                    >
                      {weatherData?.forecast?.map((day) => (
                        <option key={day.date} value={day.date}>
                          {new Date(day.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {hourlyLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
                  </div>
                ) : hourlyData && hourlyData.length > 0 ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
                    {hourlyData.map((hour) => {
                      const Icon = getConditionIcon(hour.condition);
                      const recColor = getRecommendationColor(hour.recommendation);
                      
                      return (
                        <div
                          key={hour.hour}
                          className="p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 transition-all"
                        >
                          {/* Time */}
                          <p className="text-sm font-semibold text-white mb-2">{hour.hour}</p>
                          
                          {/* Icon & Condition */}
                          <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-5 h-5 text-cyan-400" />
                            <span className="text-xs text-slate-400">{hour.condition}</span>
                          </div>
                          
                          {/* Temperature */}
                          <p className="text-xl font-bold text-white mb-2">{hour.temperature}°</p>
                          
                          {/* Details */}
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-1 text-slate-400">
                              <Droplets className="w-3 h-3" />
                              <span>{hour.humidity}%</span>
                            </div>
                            <div className="flex items-center gap-1 text-slate-400">
                              <Wind className="w-3 h-3" />
                              <span>{hour.windSpeed} km/h</span>
                            </div>
                            {hour.precipitationChance > 0 && (
                              <div className="flex items-center gap-1 text-blue-400">
                                <CloudRain className="w-3 h-3" />
                                <span>{hour.precipitationChance}%</span>
                              </div>
                            )}
                          </div>
                          
                          {/* Recommendation */}
                          <div className={`mt-3 pt-2 border-t border-slate-800 text-xs ${
                            recColor === 'green' ? 'text-emerald-400' : 
                            recColor === 'amber' ? 'text-amber-400' : 'text-red-400'
                          }`}>
                            {hour.recommendation.split('—')[0].trim()}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Select a date to view hourly forecast</p>
                  </div>
                )}
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

                  {/* Production Impact Analysis - Humidity & Wind */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Humidity Impact */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Droplets className="w-5 h-5 text-cyan-400" />
                        Humidity Impact on Production
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.humidityData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} domain={[0, 100]} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                              formatter={(value: number, name: string) => [
                                name === 'humidity' ? `${value}%` : `${Math.max(0, 100 - value * 2)}%`,
                                name === 'humidity' ? 'Humidity' : 'Impact Score'
                              ]}
                            />
                            <Bar dataKey="humidity" name="Humidity %" fill={COLORS.info} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-cyan-400"></span> &lt;75% Ideal</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> 75-85% Moderate</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> &gt;85% Challenging</span>
                      </div>
                    </div>

                    {/* Wind Speed Impact */}
                    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Wind className="w-5 h-5 text-slate-400" />
                        Wind Speed Impact on Production
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={analytics.windData}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                            <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                            <YAxis stroke="#64748b" fontSize={12} domain={[0, 50]} />
                            <Tooltip
                              contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                              formatter={(value: number) => [`${value} km/h`, 'Wind Speed']}
                            />
                            <Bar dataKey="wind" name="Wind (km/h)" fill={COLORS.muted} radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="mt-3 flex items-center gap-4 text-xs">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> &lt;20 km/h Ideal</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400"></span> 20-30 km/h Moderate</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400"></span> &gt;30 km/h Challenging</span>
                      </div>
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

            {/* Weather Alerts View */}
            {viewMode === 'alerts' && weatherData && (
              <div className="space-y-6">
                {/* Alert Summary Stats */}
                {(() => {
                  const allAlerts = generateWeatherAlerts(weatherData.forecast, scheduleData?.shootingDays || scheduleData?.days);
                  const criticalAlerts = allAlerts.filter(a => a.severity === 'critical');
                  const highAlerts = allAlerts.filter(a => a.severity === 'high');
                  const mediumAlerts = allAlerts.filter(a => a.severity === 'medium');
                  const lowAlerts = allAlerts.filter(a => a.severity === 'low');
                  
                  return (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-slate-900 border border-red-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">🔴</span>
                          <p className="text-xs text-slate-400 uppercase">Critical</p>
                        </div>
                        <p className="text-3xl font-bold text-red-400">{criticalAlerts.length}</p>
                      </div>
                      <div className="bg-slate-900 border border-orange-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">🟠</span>
                          <p className="text-xs text-slate-400 uppercase">High</p>
                        </div>
                        <p className="text-3xl font-bold text-orange-400">{highAlerts.length}</p>
                      </div>
                      <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">🟡</span>
                          <p className="text-xs text-slate-400 uppercase">Medium</p>
                        </div>
                        <p className="text-3xl font-bold text-amber-400">{mediumAlerts.length}</p>
                      </div>
                      <div className="bg-slate-900 border border-slate-500/30 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-2xl">⚪</span>
                          <p className="text-xs text-slate-400 uppercase">Low</p>
                        </div>
                        <p className="text-3xl font-bold text-slate-400">{lowAlerts.length}</p>
                      </div>
                    </div>
                  );
                })()}

                {/* Alert List */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-amber-400" />
                    Weather Alerts for Production
                  </h3>
                  <p className="text-sm text-slate-400 mb-6">
                    Automatically detected weather risks based on forecast data
                  </p>

                  {(() => {
                    const alerts = generateWeatherAlerts(weatherData.forecast, scheduleData?.shootingDays || scheduleData?.days);
                    
                    if (alerts.length === 0) {
                      return (
                        <div className="flex flex-col items-center justify-center py-12 text-center">
                          <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4">
                            <CheckCircle className="w-8 h-8 text-emerald-400" />
                          </div>
                          <h4 className="text-lg font-semibold text-white mb-2">All Clear!</h4>
                          <p className="text-slate-400 max-w-md">
                            No significant weather alerts for the next 7 days. Conditions look favorable for production.
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-3">
                        {alerts.map((alert) => {
                          const colors = getSeverityColor(alert.severity);
                          const alertDate = new Date(alert.date);
                          const today = new Date();
                          const daysUntil = Math.ceil((alertDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
                          
                          return (
                            <div
                              key={alert.id}
                              className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                  <span className="text-2xl mt-0.5">{getAlertIcon(alert.type)}</span>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h4 className={`font-semibold ${colors.text}`}>
                                        {alert.title}
                                      </h4>
                                      <span className={`px-2 py-0.5 text-xs rounded-full ${colors.badge} text-white`}>
                                        {alert.severity.toUpperCase()}
                                      </span>
                                    </div>
                                    <p className="text-sm text-slate-300 mt-1">
                                      {alert.description}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                      <span className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        {alertDate.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                                      </span>
                                      {daysUntil === 0 && (
                                        <span className="text-red-400 font-medium">Today</span>
                                      )}
                                      {daysUntil === 1 && (
                                        <span className="text-orange-400 font-medium">Tomorrow</span>
                                      )}
                                      {daysUntil > 1 && (
                                        <span>In {daysUntil} days</span>
                                      )}
                                      {alert.affectedDay && (
                                        <span className="flex items-center gap-1 text-blue-400">
                                          <Film className="w-3 h-3" />
                                          Shoot Day {alert.affectedDay}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {/* Recommended Actions */}
                {(() => {
                  const alerts = generateWeatherAlerts(weatherData.forecast, scheduleData?.shootingDays || scheduleData?.days);
                  const hasCriticalOrHigh = alerts.some(a => a.severity === 'critical' || a.severity === 'high');
                  
                  if (!hasCriticalOrHigh) return null;
                  
                  return (
                    <div className="bg-slate-900 border border-amber-500/30 rounded-xl p-6">
                      <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-amber-400" />
                        Recommended Actions
                      </h3>
                      <div className="space-y-3">
                        {alerts.filter(a => a.severity === 'critical' || a.severity === 'high').slice(0, 5).map((alert, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg">
                            <ChevronRight className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-slate-300">
                              {alert.affectedDay ? (
                                <>Consider rescheduling or preparing indoor alternatives for Day {alert.affectedDay}</>
                              ) : (
                                <>Review {alert.date} plans - {alert.title.toLowerCase()}</>
                              )}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
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

function ShortcutRow({ keys, description }: { keys: string[], description: string }) {
  return (
    <div className="flex items-center justify-between py-2 px-3 hover:bg-white/5 rounded-lg transition-colors">
      <span className="text-slate-300">{description}</span>
      <div className="flex gap-1">
        {keys.map((key, i) => (
          <kbd key={i} className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-md text-sm font-mono text-cyan-400">
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
