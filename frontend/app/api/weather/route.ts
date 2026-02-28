import { NextRequest, NextResponse } from 'next/server';

interface OpenWeatherItem {
  dt: number;
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
  };
  weather: Array<{ main: string; description: string; icon: string; id: number }>;
  wind: { speed: number };
  rain?: { '3h'?: number };
  snow?: { '3h'?: number };
}

interface OpenWeatherResponse {
  list: OpenWeatherItem[];
  city?: { name: string };
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
  forecast: WeatherForecastDay[];
  isDemo?: boolean;
  error?: string;
}

// Demo data for when API key is not available
function generateDemoForecast(locationName: string): WeatherForecastDay[] {
  const conditions = ['Clear', 'Clouds', 'Clear', 'Clouds', 'Clear'];
  const baseDate = new Date();
  const forecast: WeatherForecastDay[] = [];

  for (let i = 0; i < 5; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const condition = conditions[i];
    const isOutdoorFriendly = condition === 'Clear';

    forecast.push({
      date: date.toISOString().split('T')[0],
      condition,
      tempHigh: Math.round(28 + Math.random() * 5),
      tempLow: Math.round(20 + Math.random() * 3),
      humidity: Math.round(65 + Math.random() * 20),
      windSpeed: Math.round(10 + Math.random() * 15),
      precipitation: condition === 'Rain' ? Math.round(Math.random() * 10) : 0,
      icon: condition === 'Clear' ? '01d' : '03d',
      recommendation: isOutdoorFriendly
        ? 'Good for outdoor shooting - clear skies expected'
        : 'Cloudy conditions - good for outdoor, even lighting',
    });
  }

  return forecast;
}

function getShootingRecommendation(
  condition: string,
  precipitation: number,
  windSpeed: number,
  humidity: number
): string {
  const conditionLower = condition.toLowerCase();
  const windKmh = windSpeed * 3.6;

  if (conditionLower.includes('thunderstorm')) {
    return 'Thunderstorms expected — avoid outdoor shooting, plan indoor alternatives';
  }
  if (conditionLower.includes('snow')) {
    return 'Snow expected — plan indoor alternatives or winter gear';
  }
  if (precipitation > 10 || conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
    return 'Rain expected — plan indoor alternatives';
  }
  if (windKmh > 40) {
    return 'High winds — avoid outdoor shoots, secure equipment if filming';
  }
  if (windKmh > 25) {
    return 'Moderate winds — use wind protection for sound, secure lighting';
  }
  if (humidity > 90) {
    return 'Very high humidity — may affect equipment, consider timing';
  }
  if (conditionLower.includes('fog') || conditionLower.includes('mist') || conditionLower.includes('haze')) {
    return 'Reduced visibility — good for atmospheric shots, plan accordingly';
  }
  if (conditionLower.includes('clouds') || conditionLower.includes('cloudy')) {
    return 'Cloudy — good for outdoor shooting, even lighting';
  }
  if (conditionLower.includes('clear')) {
    return 'Good for outdoor shooting';
  }
  return 'Suitable for filming with appropriate preparation';
}

// Default location: Chennai (Tamil Nadu) - hub for Tamil film industry
const DEFAULT_LOCATION = {
  lat: 13.0827,  // Chennai coordinates
  lng: 80.2707,
  name: 'Chennai, Tamil Nadu'
};

export async function GET(req: NextRequest) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const useDemo = !apiKey || apiKey === 'your-openweathermap-key' || apiKey === 'demo';

  // Get lat/lng from query params, fall back to defaults
  let lat = req.nextUrl.searchParams.get('lat');
  let lng = req.nextUrl.searchParams.get('lng');
  let location = req.nextUrl.searchParams.get('location');

  // Use default location if not provided
  if (!lat || !lng) {
    lat = DEFAULT_LOCATION.lat.toString();
    lng = DEFAULT_LOCATION.lng.toString();
    location = location || DEFAULT_LOCATION.name;
    console.log('[GET /api/weather] Using default location: Chennai, Tamil Nadu');
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

  // Use demo data if API key is not configured properly
  if (useDemo) {
    console.log('[GET /api/weather] Using demo data (no API key configured)');
    const forecast = generateDemoForecast(location);
    return NextResponse.json({
      location,
      forecast,
      isDemo: true,
    } satisfies WeatherResponse);
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latNum}&lon=${lngNum}&appid=${apiKey}&units=metric`;
    const res = await fetch(url);

    if (!res.ok) {
      const errText = await res.text();
      console.error('[GET /api/weather] OpenWeatherMap error:', res.status, errText);
      // Fall back to demo data on API error
      const forecast = generateDemoForecast(location);
      return NextResponse.json({
        location,
        forecast,
        isDemo: true,
        error: 'Using demo data - API call failed',
      } satisfies WeatherResponse);
    }

    const data: OpenWeatherResponse = await res.json();

    const byDay = new Map<
      string,
      {
        temps: number[];
        humiditySum: number;
        humidityCount: number;
        windSum: number;
        windCount: number;
        precipitation: number;
        condition: string;
        icon: string;
        conditionId: number;
      }
    >();

    for (const item of data.list) {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      let existing = byDay.get(date);
      if (!existing) {
        existing = {
          temps: [],
          humiditySum: 0,
          humidityCount: 0,
          windSum: 0,
          windCount: 0,
          precipitation: 0,
          condition: item.weather[0]?.main ?? 'Unknown',
          icon: item.weather[0]?.icon ?? '01d',
          conditionId: item.weather[0]?.id ?? 800,
        };
        byDay.set(date, existing);
      }

      existing.temps.push(item.main.temp);
      existing.humiditySum += item.main.humidity;
      existing.humidityCount += 1;
      existing.windSum += item.wind.speed;
      existing.windCount += 1;
      existing.precipitation += item.rain?.['3h'] ?? 0;
      existing.precipitation += item.snow?.['3h'] ?? 0;
      if (item.weather[0] && (item.weather[0].id >= 200 && item.weather[0].id < 800)) {
        existing.condition = item.weather[0].main;
        existing.icon = item.weather[0].icon;
        existing.conditionId = item.weather[0].id;
      }
    }

    const forecast: WeatherForecastDay[] = [];
    const sortedDates = Array.from(byDay.keys()).sort();

    for (const date of sortedDates) {
      const d = byDay.get(date)!;
      const tempHigh = Math.max(...d.temps);
      const tempLow = Math.min(...d.temps);
      const humidity = Math.round(d.humiditySum / d.humidityCount);
      const windSpeed = Math.round((d.windSum / d.windCount) * 3.6);
      const precipitation = Math.round(d.precipitation * 10) / 10;

      const recommendation = getShootingRecommendation(
        d.condition,
        d.precipitation,
        d.windSum / d.windCount,
        humidity
      );

      forecast.push({
        date,
        condition: d.condition,
        tempHigh,
        tempLow,
        humidity,
        windSpeed,
        precipitation,
        icon: d.icon,
        recommendation,
      });
    }

    const locationName =
      location || data.city?.name || `${latNum.toFixed(2)}, ${lngNum.toFixed(2)}`;

    return NextResponse.json({
      location: locationName,
      forecast,
    } satisfies WeatherResponse);
  } catch (error) {
    console.error('[GET /api/weather]', error);
    // Fall back to demo data on any error
    const forecast = generateDemoForecast(location);
    return NextResponse.json({
      location,
      forecast,
      isDemo: true,
      error: 'Using demo data - API call failed',
    } satisfies WeatherResponse);
  }
}
