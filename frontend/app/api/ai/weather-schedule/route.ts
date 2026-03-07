import { NextRequest, NextResponse } from 'next/server';

// Weather-Aware Scheduling API
// Analyzes weather forecasts and provides scheduling recommendations

interface ScheduleDay {
  date?: string;
  scenes?: number;
  isOutdoor?: boolean;
  isNight?: boolean;
}

interface WeatherScheduleRequest {
  schedule?: ScheduleDay[];
  location?: string;
}

// Generate mock 14-day weather forecast
function generateWeatherForecast(location: string): Array<{
  date: string;
  dayName: string;
  tempHigh: number;
  tempLow: number;
  condition: string;
  rainChance: number;
  humidity: number;
  windSpeed: number;
}> {
  const conditions = ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Heavy Rain', 'Sunny'];
  const today = new Date();
  
  return Array.from({ length: 14 }, (_, i) => {
    const date = new Date(today);
    date.setDate(date.getDate() + i);
    
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const dayName = dayNames[date.getDay()];
    
    // Simulate monsoon season patterns (June-September in India)
    const isMonsoon = ['Jun', 'Jul', 'Aug', 'Sep'].includes(date.toLocaleString('en-US', { month: 'short' }));
    const baseRainChance = isMonsoon ? 60 : 20;
    
    // Random weather generation with some coherence
    const rainChance = Math.min(95, Math.max(0, baseRainChance + Math.random() * 30 - 15));
    const isRainy = rainChance > 40;
    
    let condition = 'Clear';
    if (isRainy) {
      condition = rainChance > 70 ? 'Heavy Rain' : rainChance > 50 ? 'Light Rain' : 'Cloudy';
    } else {
      condition = Math.random() > 0.5 ? 'Clear' : 'Partly Cloudy';
    }
    
    // Temperature varies by season
    const isSummer = ['Apr', 'May', 'Jun'].includes(date.toLocaleString('en-US', { month: 'short' }));
    const baseTemp = isSummer ? 35 : 28;
    const tempHigh = Math.round(baseTemp + Math.random() * 5);
    const tempLow = Math.round(tempHigh - 8 + Math.random() * 4);
    
    return {
      date: date.toISOString().split('T')[0],
      dayName: i === 0 ? 'Today' : dayName,
      tempHigh,
      tempLow,
      condition,
      rainChance: Math.round(rainChance),
      humidity: Math.round(50 + Math.random() * 40),
      windSpeed: Math.round(5 + Math.random() * 20),
    };
  });
}

// Find best days for outdoor shooting
function findBestDays(forecast: any[], preferNightShoots: boolean = false): string[] {
  return forecast
    .filter(day => {
      // Reject days with high rain chance
      if (day.rainChance > 40) return false;
      // Reject extreme temperatures
      if (day.tempHigh > 40 || day.tempLow < 10) return false;
      return true;
    })
    .slice(0, 5)
    .map(day => day.dayName === 'Today' ? 'Today' : `${day.dayName} (${day.date.slice(5)})`);
}

// Generate schedule recommendations
function generateRecommendations(
  forecast: any[], 
  schedule: ScheduleDay[], 
  location: string
): Array<{
  type: 'indoor_shoot' | 'outdoor_shoot' | 'weather_contigency' | 'night_shoot';
  date: string;
  reason: string;
  confidence: number;
}> {
  const recommendations: Array<{
    type: 'indoor_shoot' | 'outdoor_shoot' | 'weather_contigency' | 'night_shoot';
    date: string;
    reason: string;
    confidence: number;
  }> = [];
  
  // Check each scheduled day against weather
  for (let i = 0; i < Math.min(schedule.length, 14); i++) {
    const schedDay = schedule[i];
    const forecastDay = forecast[i];
    
    if (!forecastDay) continue;
    
    // High rain warning
    if (forecastDay.rainChance > 60 && schedDay.isOutdoor) {
      recommendations.push({
        type: 'weather_contigency',
        date: forecastDay.date,
        reason: `High rain chance (${forecastDay.rainChance}%) - consider indoor alternative or rescheduling`,
        confidence: 85,
      });
    }
    
    // Good outdoor day
    if (forecastDay.rainChance < 30 && schedDay.isOutdoor) {
      recommendations.push({
        type: 'outdoor_shoot',
        date: forecastDay.date,
        reason: `Ideal weather for outdoor shooting - ${forecastDay.condition}, ${forecastDay.tempHigh}°C`,
        confidence: 80,
      });
    }
    
    // Night shoot recommendation
    if (schedDay.isNight && forecastDay.tempHigh > 32) {
      recommendations.push({
        type: 'night_shoot',
        date: forecastDay.date,
        reason: `High daytime temp (${forecastDay.tempHigh}°) - night shoots recommended to avoid heat`,
        confidence: 75,
      });
    }
  }
  
  // Add general recommendations
  const monsoonMonths = ['Jun', 'Jul', 'Aug', 'Sep'];
  const currentMonth = new Date().toLocaleString('en-US', { month: 'short' });
  
  if (monsoonMonths.includes(currentMonth)) {
    recommendations.push({
      type: 'weather_contigency',
      date: 'General',
      reason: 'Monsoon season - maintain 20% schedule buffer for weather contingencies',
      confidence: 90,
    });
  }
  
  return recommendations.slice(0, 8);
}

export async function POST(req: NextRequest) {
  try {
    const body: WeatherScheduleRequest = await req.json();
    const { schedule = [], location = 'Chennai' } = body;
    
    // Generate weather forecast
    const forecast = generateWeatherForecast(location);
    
    // Find best days for outdoor shooting
    const bestDays = findBestDays(forecast);
    
    // Generate recommendations
    const recommendations = generateRecommendations(forecast, schedule, location);
    
    return NextResponse.json({
      location,
      forecast,
      best_days: bestDays,
      recommendations,
      summary: {
        total_days: forecast.length,
        good_outdoor_days: forecast.filter(d => d.rainChance < 30).length,
        risky_days: forecast.filter(d => d.rainChance > 50).length,
        avg_temp: Math.round(forecast.reduce((sum, d) => sum + d.tempHigh, 0) / forecast.length),
        avg_humidity: Math.round(forecast.reduce((sum, d) => sum + d.humidity, 0) / forecast.length),
      },
    });
  } catch (error) {
    console.error('Weather schedule analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze weather schedule' },
      { status: 500 }
    );
  }
}

// GET endpoint for demo/preview
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const location = url.searchParams.get('location') || 'Chennai';
  
  const forecast = generateWeatherForecast(location);
  const bestDays = findBestDays(forecast);
  
  // Demo schedule for preview
  const demoSchedule: ScheduleDay[] = [
    { date: '2024-01-15', scenes: 5, isOutdoor: true, isNight: false },
    { date: '2024-01-16', scenes: 8, isOutdoor: false, isNight: true },
    { date: '2024-01-17', scenes: 6, isOutdoor: true, isNight: false },
    { date: '2024-01-18', scenes: 4, isOutdoor: false, isNight: false },
    { date: '2024-01-19', scenes: 7, isOutdoor: true, isNight: true },
  ];
  
  const recommendations = generateRecommendations(forecast, demoSchedule, location);
  
  return NextResponse.json({
    location,
    forecast,
    best_days: bestDays,
    recommendations,
    summary: {
      total_days: forecast.length,
      good_outdoor_days: forecast.filter(d => d.rainChance < 30).length,
      risky_days: forecast.filter(d => d.rainChance > 50).length,
      avg_temp: Math.round(forecast.reduce((sum, d) => sum + d.tempHigh, 0) / forecast.length),
      avg_humidity: Math.round(forecast.reduce((sum, d) => sum + d.humidity, 0) / forecast.length),
    },
    demo: true,
  });
}
