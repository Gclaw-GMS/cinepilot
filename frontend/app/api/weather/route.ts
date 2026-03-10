import { NextRequest, NextResponse } from 'next/server';

interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  relative_humidity_2m_max: number[];
  wind_speed_10m_max: number[];
  precipitation_sum: number[];
  weather_code: number[];
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  daily: OpenMeteoDaily;
}

export interface WeatherForecastDay {
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

export interface WeatherResponse {
  location: string;
  lat: number;
  lng: number;
  forecast: WeatherForecastDay[];
  isDemo?: boolean;
  error?: string;
}

// WMO Weather interpretation codes
function getWeatherCondition(code: number): { condition: string; icon: string } {
  const conditions: Record<number, { condition: string; icon: string }> = {
    0: { condition: 'Clear', icon: '01d' },
    1: { condition: 'Mainly Clear', icon: '01d' },
    2: { condition: 'Partly Cloudy', icon: '02d' },
    3: { condition: 'Overcast', icon: '03d' },
    45: { condition: 'Fog', icon: '50d' },
    48: { condition: 'Fog', icon: '50d' },
    51: { condition: 'Drizzle', icon: '09d' },
    53: { condition: 'Drizzle', icon: '09d' },
    55: { condition: 'Drizzle', icon: '09d' },
    61: { condition: 'Rain', icon: '10d' },
    63: { condition: 'Rain', icon: '10d' },
    65: { condition: 'Rain', icon: '10d' },
    71: { condition: 'Snow', icon: '13d' },
    73: { condition: 'Snow', icon: '13d' },
    75: { condition: 'Snow', icon: '13d' },
    77: { condition: 'Snow', icon: '13d' },
    80: { condition: 'Showers', icon: '09d' },
    81: { condition: 'Showers', icon: '09d' },
    82: { condition: 'Showers', icon: '09d' },
    85: { condition: 'Snow Showers', icon: '13d' },
    86: { condition: 'Snow Showers', icon: '13d' },
    95: { condition: 'Thunderstorm', icon: '11d' },
    96: { condition: 'Thunderstorm', icon: '11d' },
    99: { condition: 'Thunderstorm', icon: '11d' },
  };
  return conditions[code] || { condition: 'Unknown', icon: '01d' };
}

function getShootingRecommendation(
  condition: string,
  precipitation: number,
  windSpeed: number,
  humidity: number
): string {
  const conditionLower = condition.toLowerCase();
  const windKmh = windSpeed;

  if (conditionLower.includes('thunderstorm')) {
    return '⛈️ Thunderstorms — avoid outdoor shooting, plan indoor alternatives';
  }
  if (conditionLower.includes('snow')) {
    return '❄️ Snow — plan indoor alternatives or winter gear';
  }
  if (precipitation > 10 || conditionLower.includes('rain') || conditionLower.includes('drizzle') || conditionLower.includes('showers')) {
    return '🌧️ Rain expected — plan indoor alternatives';
  }
  if (windKmh > 40) {
    return '💨 High winds — avoid outdoor shoots, secure equipment';
  }
  if (windKmh > 25) {
    return '💨 Moderate winds — use wind protection for sound, secure lighting';
  }
  if (humidity > 90) {
    return '💧 Very high humidity — may affect equipment, consider timing';
  }
  if (conditionLower.includes('fog') || conditionLower.includes('mist')) {
    return '🌫️ Reduced visibility — good for atmospheric shots, plan accordingly';
  }
  if (conditionLower.includes('cloudy') || conditionLower.includes('overcast')) {
    return '☁️ Cloudy — good for outdoor shooting, even lighting';
  }
  if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
    return '☀️ Clear skies — perfect for outdoor shooting';
  }
  return '✅ Suitable for filming with appropriate preparation';
}

// Default location: Chennai (Tamil Nadu) - hub for Tamil film industry
const DEFAULT_LOCATION = {
  lat: 13.0827,
  lng: 80.2707,
  name: 'Chennai, Tamil Nadu'
};

// Demo data for fallback
function generateDemoForecast(locationName: string): WeatherForecastDay[] {
  const conditions = ['Clear', 'Clouds', 'Clear', 'Partly Cloudy', 'Clear'];
  const baseDate = new Date();
  const forecast: WeatherForecastDay[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const condition = conditions[i] || 'Clear';

    forecast.push({
      date: date.toISOString().split('T')[0],
      condition,
      tempHigh: Math.round(28 + Math.random() * 5),
      tempLow: Math.round(20 + Math.random() * 3),
      humidity: Math.round(65 + Math.random() * 20),
      windSpeed: Math.round(10 + Math.random() * 15),
      precipitation: condition.includes('Rain') ? Math.round(Math.random() * 10) : 0,
      icon: condition === 'Clear' ? '01d' : '03d',
      recommendation: condition === 'Clear'
        ? '☀️ Clear skies — perfect for outdoor shooting'
        : '☁️ Good for outdoor, even lighting',
    });
  }

  return forecast;
}

export async function GET(req: NextRequest) {
  // Get lat/lng from query params, fall back to defaults
  let lat = req.nextUrl.searchParams.get('lat');
  let lng = req.nextUrl.searchParams.get('lng');
  let location = req.nextUrl.searchParams.get('location');

  // Use default location if not provided
  if (!lat || !lng) {
    lat = DEFAULT_LOCATION.lat.toString();
    lng = DEFAULT_LOCATION.lng.toString();
    location = location || DEFAULT_LOCATION.name;
  } else if (!location) {
    location = `${lat}, ${lng}`;
  }

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);

  if (isNaN(latNum) || isNaN(lngNum)) {
    return NextResponse.json(
      { error: 'Invalid lat or lng values' },
      { status: 400 }
    );
  }

  try {
    // Use Open-Meteo API (free, no API key required)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lngNum}&daily=weather_code,temperature_2m_max,temperature_2m_min,relative_humidity_2m_max,wind_speed_10m_max,precipitation_sum&timezone=auto&forecast_days=7`;
    
    const res = await fetch(url);

    if (!res.ok) {
      const errText = await res.text();
      console.error('[GET /api/weather] Open-Meteo error:', res.status, errText);
      // Fall back to demo data on API error
      const forecast = generateDemoForecast(location);
      return NextResponse.json({
        location,
        lat: latNum,
        lng: lngNum,
        forecast,
        isDemo: true,
        error: 'Using demo data - API call failed',
      } satisfies WeatherResponse);
    }

    const data: OpenMeteoResponse = await res.json();

    const forecast: WeatherForecastDay[] = [];

    for (let i = 0; i < data.daily.time.length; i++) {
      const weatherInfo = getWeatherCondition(data.daily.weather_code[i]);
      const humidity = data.daily.relative_humidity_2m_max[i];
      const windSpeed = data.daily.wind_speed_10m_max[i];
      const precipitation = data.daily.precipitation_sum[i];

      const recommendation = getShootingRecommendation(
        weatherInfo.condition,
        precipitation,
        windSpeed,
        humidity
      );

      forecast.push({
        date: data.daily.time[i],
        condition: weatherInfo.condition,
        tempHigh: Math.round(data.daily.temperature_2m_max[i]),
        tempLow: Math.round(data.daily.temperature_2m_min[i]),
        humidity,
        windSpeed: Math.round(windSpeed),
        precipitation: Math.round(precipitation * 10) / 10,
        icon: weatherInfo.icon,
        recommendation,
      });
    }

    return NextResponse.json({
      location,
      lat: latNum,
      lng: lngNum,
      forecast,
    } satisfies WeatherResponse);
  } catch (error) {
    console.error('[GET /api/weather]', error);
    // Fall back to demo data on any error
    const forecast = generateDemoForecast(location);
    return NextResponse.json({
      location,
      lat: latNum,
      lng: lngNum,
      forecast,
      isDemo: true,
      error: 'Using demo data - API call failed',
    } satisfies WeatherResponse);
  }
}
