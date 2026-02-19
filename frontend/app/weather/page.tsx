'use client'

import { useState, useEffect } from 'react'
import { Card, StatCard, Button, Badge, PageHeader } from '../components/ui/ProfessionalCard'
import { Cloud, Sun, CloudRain, Wind, Thermometer, Droplets, MapPin, RefreshCw, Download, AlertTriangle } from 'lucide-react'

// Weather data types
interface WeatherDay {
  date: string
  condition: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'windy' | 'foggy'
  tempHigh: number
  tempLow: number
  humidity: number
  windSpeed: number
  precipitation: number
  recommendation: string
}

interface LocationWeather {
  location: string
  forecast: WeatherDay[]
}

// Generate mock weather data
const generateWeatherData = (): LocationWeather[] => {
  const locations = ['Chennai', 'Coimbatore', 'Ooty', 'Madurai']
  const conditions: WeatherDay['condition'][] = ['sunny', 'cloudy', 'rainy', 'sunny', 'cloudy', 'sunny', 'rainy']
  
  return locations.map(loc => ({
    location: loc,
    forecast: Array.from({ length: 14 }, (_, i) => {
      const condition = conditions[Math.floor(Math.random() * conditions.length)]
      return {
        date: new Date(Date.now() + i * 86400000).toISOString().split('T')[0],
        condition,
        tempHigh: Math.floor(Math.random() * 15) + 25,
        tempLow: Math.floor(Math.random() * 10) + 18,
        humidity: Math.floor(Math.random() * 40) + 40,
        windSpeed: Math.floor(Math.random() * 30) + 10,
        precipitation: condition === 'rainy' ? Math.floor(Math.random() * 60) + 40 : Math.floor(Math.random() * 20),
        recommendation: condition === 'rainy' ? 'Indoor shots recommended' : condition === 'sunny' ? 'Perfect for outdoor' : 'Good for all shots'
      }
    })
  }))
}

const conditionIcons: Record<string, any> = {
  sunny: Sun,
  cloudy: Cloud,
  rainy: CloudRain,
  stormy: CloudRain,
  windy: Wind,
  foggy: Cloud,
}

const conditionColors: Record<string, string> = {
  sunny: 'from-amber-500 to-orange-500',
  cloudy: 'from-slate-400 to-slate-500',
  rainy: 'from-blue-500 to-indigo-500',
  stormy: 'from-purple-600 to-indigo-700',
  windy: 'from-cyan-400 to-blue-500',
  foggy: 'from-slate-300 to-slate-400',
}

export default function WeatherPage() {
  const [weatherData, setWeatherData] = useState<LocationWeather[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedLocation, setSelectedLocation] = useState<string>('all')
  const [lastUpdated, setLastUpdated] = useState<string>('')

  useEffect(() => {
    loadWeather()
  }, [])

  const loadWeather = () => {
    setLoading(true)
    setTimeout(() => {
      setWeatherData(generateWeatherData())
      setLastUpdated(new Date().toLocaleTimeString())
      setLoading(false)
    }, 1000)
  }

  const filteredData = selectedLocation === 'all' 
    ? weatherData 
    : weatherData.filter(w => w.location === selectedLocation)

  const sunnyDays = weatherData.flatMap(w => w.forecast).filter(d => d.condition === 'sunny').length
  const rainyDays = weatherData.flatMap(w => w.forecast).filter(d => d.condition === 'rainy').length
  const cloudyDays = weatherData.flatMap(w => w.forecast).filter(d => d.condition === 'cloudy').length

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8">
      <PageHeader 
        title="Weather Forecast" 
        subtitle="14-day weather outlook for production locations"
        action={
          <Button onClick={loadWeather}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <StatCard title="Sunny Days" value={sunnyDays} color="amber" icon={<Sun className="w-5 h-5" />} />
        <StatCard title="Cloudy Days" value={cloudyDays} color="indigo" icon={<Cloud className="w-5 h-5" />} />
        <StatCard title="Rainy Days" value={rainyDays} color="blue" icon={<CloudRain className="w-5 h-5" />} />
        <StatCard title="Locations" value={weatherData.length} color="indigo" icon={<MapPin className="w-5 h-5" />} />
      </div>

      {/* Location Filter */}
      <Card className="mb-6">
        <div className="flex items-center gap-4">
          <span className="text-slate-400">Filter by location:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedLocation('all')}
              className={`px-4 py-2 rounded-lg text-sm transition-all ${
                selectedLocation === 'all' ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
              }`}
            >
              All Locations
            </button>
            {weatherData.map(w => (
              <button
                key={w.location}
                onClick={() => setSelectedLocation(w.location)}
                className={`px-4 py-2 rounded-lg text-sm transition-all ${
                  selectedLocation === w.location ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                }`}
              >
                {w.location}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse">
              <div className="h-6 bg-slate-800 rounded w-1/3 mb-4" />
              <div className="space-y-3">
                {[1, 2, 3].map(j => (
                  <div key={j} className="h-16 bg-slate-800/50 rounded" />
                ))}
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredData.map(locData => (
            <Card key={locData.location}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/20 rounded-lg">
                  <MapPin className="w-5 h-5 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold">{locData.location}</h3>
              </div>

              <div className="space-y-3">
                {locData.forecast.slice(0, 7).map((day, i) => {
                  const Icon = conditionIcons[day.condition] || Sun
                  return (
                    <div 
                      key={i} 
                      className="flex items-center gap-4 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors"
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${conditionColors[day.condition]} flex items-center justify-center`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{day.date.slice(5)}</span>
                          <Badge variant={day.condition === 'rainy' ? 'amber' : day.condition === 'sunny' ? 'emerald' : 'slate'}>
                            {day.tempHigh}° / {day.tempLow}°
                          </Badge>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                          <span className="flex items-center gap-1"><Droplets className="w-3 h-3" />{day.humidity}%</span>
                          <span className="flex items-center gap-1"><Wind className="w-3 h-3" />{day.windSpeed}km/h</span>
                        </div>
                      </div>
                      {day.condition === 'rainy' && (
                        <AlertTriangle className="w-4 h-4 text-amber-400" />
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          ))}
        </div>
      )}

      {lastUpdated && (
        <p className="text-center text-slate-500 text-sm mt-6">
          Last updated: {lastUpdated}
        </p>
      )}
    </div>
  )
}
