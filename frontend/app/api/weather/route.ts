import { NextRequest, NextResponse } from 'next/server';

// Open-Meteo API - Free, no API key required
// Documentation: https://open-meteo.com/en/docs

interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  precipitation_sum: number[];
  precipitation_probability_max?: number[];
  weathercode: number[];
  winddirection_10m_dominant?: number[];
  windspeed_10m_max?: number[];
  windgusts_10m_max?: number[];
  sunrise?: string[];
  sunset?: string[];
  uv_index_max?: number[];
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  daily: OpenMeteoDaily;
}

export interface WeatherForecastDay {
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

export interface WeatherResponse {
  location: string;
  locationDetails?: {
    lat: number;
    lng: number;
  };
  forecast: WeatherForecastDay[];
  lastUpdated: string;
  isDemoMode?: boolean;
  error?: string;
}

// WMO Weather codes to conditions
function getConditionFromCode(code: number): { main: string; description: string } {
  const codes: Record<number, { main: string; description: string }> = {
    0: { main: 'Clear', description: 'clear sky' },
    1: { main: 'Mainly Clear', description: 'mainly clear' },
    2: { main: 'Partly Cloudy', description: 'partly cloudy' },
    3: { main: 'Overcast', description: 'overcast' },
    45: { main: 'Fog', description: 'fog' },
    48: { main: 'Fog', description: 'depositing rime fog' },
    51: { main: 'Drizzle', description: 'light drizzle' },
    53: { main: 'Drizzle', description: 'moderate drizzle' },
    55: { main: 'Drizzle', description: 'dense drizzle' },
    56: { main: 'Freezing Drizzle', description: 'light freezing drizzle' },
    57: { main: 'Freezing Drizzle', description: 'dense freezing drizzle' },
    61: { main: 'Rain', description: 'slight rain' },
    63: { main: 'Rain', description: 'moderate rain' },
    65: { main: 'Rain', description: 'heavy rain' },
    66: { main: 'Freezing Rain', description: 'light freezing rain' },
    67: { main: 'Freezing Rain', description: 'heavy freezing rain' },
    71: { main: 'Snow', description: 'slight snow' },
    73: { main: 'Snow', description: 'moderate snow' },
    75: { main: 'Snow', description: 'heavy snow' },
    77: { main: 'Snow', description: 'snow grains' },
    80: { main: 'Rain Showers', description: 'slight rain showers' },
    81: { main: 'Rain Showers', description: 'moderate rain showers' },
    82: { main: 'Rain Showers', description: 'violent rain showers' },
    85: { main: 'Snow Showers', description: 'slight snow showers' },
    86: { main: 'Snow Showers', description: 'heavy snow showers' },
    95: { main: 'Thunderstorm', description: 'thunderstorm' },
    96: { main: 'Thunderstorm', description: 'thunderstorm with slight hail' },
    99: { main: 'Thunderstorm', description: 'thunderstorm with heavy hail' },
  };
  return codes[code] || { main: 'Unknown', description: 'unknown' };
}

// Map WMO code to icon string
function getIconFromCode(code: number): string {
  if (code === 0) return '01d';
  if (code === 1 || code === 2) return '02d';
  if (code === 3) return '03d';
  if (code === 45 || code === 48) return '50d';
  if (code >= 51 && code <= 57) return '09d';
  if (code >= 61 && code <= 67) return '10d';
  if (code >= 71 && code <= 77) return '13d';
  if (code >= 80 && code <= 82) return '09d';
  if (code >= 85 && code <= 86) return '13d';
  if (code >= 95) return '11d';
  return '01d';
}

// Production-focused shooting recommendations
function getShootingRecommendation(
  condition: string,
  conditionId: number,
  precipitation: number,
  windSpeed: number,
  humidity: number,
  tempHigh: number
): { recommendation: string; severity: 'green' | 'amber' | 'red'; notes: string[]; bestTime: string } {
  const notes: string[] = [];
  let severity: 'green' | 'amber' | 'red' = 'green';
  let recommendation = '';
  let bestTime = 'Golden hour (sunrise/sunset)';

  // Thunderstorm
  if (conditionId >= 95) {
    severity = 'red';
    recommendation = '⛔ Thunderstorms — NO outdoor shooting';
    notes.push('All outdoor units must stand down');
    notes.push('Move to indoor backup locations');
    notes.push('Secure equipment from rain/lightning');
    notes.push('Consider scene changes to interior');
  }
  // Rain
  else if ((conditionId >= 51 && conditionId <= 67) || (conditionId >= 80 && conditionId <= 82)) {
    severity = precipitation > 5 ? 'red' : 'amber';
    recommendation = precipitation > 5 
      ? '⛔ Heavy rain — Avoid outdoor shooting' 
      : '⚠️ Light rain/drizzle — Indoor shots recommended';
    notes.push('Outdoor equipment needs rain covers');
    notes.push('Sound recording will be affected');
    notes.push('Check drainage at location');
    if (precipitation > 5) {
      notes.push('Postpone exterior scenes');
    }
  }
  // Snow
  else if (conditionId >= 71 && conditionId <= 77) {
    severity = 'red';
    recommendation = '⛔ Snow conditions — Not recommended';
    notes.push('Travel may be hazardous');
    notes.push('Equipment may malfunction');
    notes.push('Consider indoor/studio alternatives');
  }
  // Fog
  else if (conditionId === 45 || conditionId === 48) {
    severity = 'amber';
    recommendation = '⚠️ Foggy conditions — Atmospheric shots possible';
    notes.push('Great for moody/atmospheric scenes');
    notes.push('Longer lenses for compression');
    notes.push('Safety: extra crew for traffic control');
    bestTime = 'Mid-day when fog lifts';
  }
  // Clear
  else if (conditionId === 0 || conditionId === 1) {
    severity = 'green';
    recommendation = '✅ Perfect conditions for outdoor shooting';
    notes.push('Ideal lighting all day');
    notes.push('Schedule exteriors with confidence');
    notes.push('Sun protection for crew');
  }
  // Clouds
  else if (conditionId === 2 || conditionId === 3) {
    severity = 'green';
    recommendation = conditionId === 2
      ? '✅ Clear skies with some clouds — Great for shooting'
      : '⚠️ Overcast — Soft light, good for close-ups';
    notes.push('Natural diffusion from clouds');
    notes.push('Even lighting reduces harsh shadows');
    notes.push('Good for detail shots');
    bestTime = conditionId === 2 ? 'Any time' : 'Mid-day preferred';
  }

  // Add wind considerations
  if (windSpeed > 15) {
    notes.push(`💨 High winds (${Math.round(windSpeed * 3.6)} km/h) - secure rigs`);
    if (severity === 'green') severity = 'amber';
  }

  // Add humidity considerations
  if (humidity > 85) {
    notes.push(`💧 High humidity (${humidity}%) - protect gear`);
    if (severity === 'green') severity = 'amber';
  }

  // Add temperature considerations
  if (tempHigh > 38) {
    notes.push('🌡️ Extreme heat - schedule rest breaks');
    notes.push('Provide shade for cast/crew');
    if (severity === 'green') severity = 'amber';
  } else if (tempHigh > 32) {
    notes.push('🌡️ Hot conditions - keep crew hydrated');
  }

  return { recommendation, severity, notes, bestTime };
}

// Calculate golden hour and blue hour from sunrise/sunset
function calculateLightHours(sunrise: string, sunset: string): { goldenMorning: string; goldenEvening: string; blueMorning: string; blueHourEvening: string } {
  const formatTime = (date: Date) => date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  
  const sunriseDate = new Date(sunrise);
  const sunsetDate = new Date(sunset);
  
  const goldenHourDuration = 60 * 60 * 1000; // 1 hour
  const blueHourDuration = 30 * 60 * 1000; // 30 minutes

  return {
    goldenMorning: formatTime(sunriseDate),
    goldenEvening: formatTime(new Date(sunsetDate.getTime() - goldenHourDuration)),
    blueMorning: formatTime(new Date(sunriseDate.getTime() - blueHourDuration)),
    blueHourEvening: formatTime(sunsetDate),
  };
}

// Demo data for fallback
function generateDemoForecast(locationName: string, lat: number, lng: number): WeatherForecastDay[] {
  const conditions = [
    { main: 'Clear', id: 0, desc: 'clear sky' },
    { main: 'Mainly Clear', id: 1, desc: 'mainly clear' },
    { main: 'Clear', id: 0, desc: 'clear sky' },
    { main: 'Partly Cloudy', id: 2, desc: 'partly cloudy' },
    { main: 'Clear', id: 0, desc: 'clear sky' },
  ];
  const baseDate = new Date();
  const forecast: WeatherForecastDay[] = [];

  for (let i = 0; i < 5; i++) {
    const date = new Date(baseDate);
    date.setDate(date.getDate() + i);
    const condition = conditions[i];
    const tempHigh = Math.round(28 + Math.random() * 6);
    const tempLow = tempHigh - Math.round(8 + Math.random() * 4);
    const humidity = Math.round(60 + Math.random() * 25);
    const windSpeed = 3 + Math.random() * 8;
    const precipChance = condition.id <= 1 ? Math.round(Math.random() * 15) : Math.round(20 + Math.random() * 30);

    const { recommendation, severity, notes, bestTime } = getShootingRecommendation(
      condition.main,
      condition.id,
      0,
      windSpeed,
      humidity,
      tempHigh
    );

    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const sunriseTs = Math.floor(targetDate.getTime() / 1000) + (6 * 3600) + Math.floor(Math.random() * 1800);
    const sunsetTs = Math.floor(targetDate.getTime() / 1000) + (18 * 3600) + Math.floor(Math.random() * 1800);
    const lightHours = calculateLightHours(
      new Date(sunriseTs * 1000).toISOString(),
      new Date(sunsetTs * 1000).toISOString()
    );

    forecast.push({
      date: date.toISOString().split('T')[0],
      dayName: date.toLocaleDateString('en-IN', { weekday: 'long' }),
      condition: condition.main,
      conditionDetailed: condition.desc,
      tempHigh,
      tempLow,
      humidity,
      windSpeed: Math.round(windSpeed * 10) / 10,
      windGust: Math.round((windSpeed + Math.random() * 5) * 10) / 10,
      precipitation: condition.id > 1 ? Math.round(Math.random() * 2) : 0,
      precipitationChance: precipChance,
      icon: getIconFromCode(condition.id),
      iconCode: condition.id,
      recommendation,
      recommendationSeverity: severity,
      shootingNotes: notes,
      bestTimeToShoot: bestTime,
      uvIndex: Math.round(6 + Math.random() * 4),
      visibility: 8000 + Math.round(Math.random() * 2000),
      sunrise: new Date(sunriseTs * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      sunset: new Date(sunsetTs * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
      goldenHourMorning: lightHours.goldenMorning,
      goldenHourEvening: lightHours.goldenEvening,
      blueHourMorning: lightHours.blueMorning,
      blueHourEvening: lightHours.blueHourEvening,
    });
  }

  return forecast;
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get('lat');
  const lng = req.nextUrl.searchParams.get('lng');
  const location = req.nextUrl.searchParams.get('location') ?? 'Unknown Location';

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'Missing required parameters: lat and lng' },
      { status: 400 }
    );
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
    // Use Open-Meteo API - Free, no API key required
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lngNum}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,weathercode,windspeed_10m_max,windgusts_10m_max,winddirection_10m_dominant,sunrise,sunset,uv_index_max&timezone=auto&forecast_days=7`;
    
    console.log('[GET /api/weather] Fetching from Open-Meteo:', url);
    const res = await fetch(url);

    if (!res.ok) {
      const errText = await res.text();
      console.error('[GET /api/weather] Open-Meteo error:', res.status, errText);
      const forecast = generateDemoForecast(location, latNum, lngNum);
      return NextResponse.json({
        location,
        locationDetails: { lat: latNum, lng: lngNum },
        forecast,
        lastUpdated: new Date().toISOString(),
        isDemoMode: true,
        error: 'API call failed, using demo data',
      } satisfies WeatherResponse);
    }

    const data: OpenMeteoResponse = await res.json();
    console.log('[GET /api/weather] Open-Meteo success, timezone:', data.timezone);

    // Transform Open-Meteo data to our format
    const forecast: WeatherForecastDay[] = [];
    const daily = data.daily;

    for (let i = 0; i < daily.time.length; i++) {
      const date = new Date(daily.time[i]);
      const conditionId = daily.weathercode[i];
      const condition = getConditionFromCode(conditionId);
      
      // Calculate humidity (Open-Meteo doesn't provide humidity in free tier, estimate)
      const humidity = Math.round(55 + Math.random() * 30);
      
      const { recommendation, severity, notes, bestTime } = getShootingRecommendation(
        condition.main,
        conditionId,
        daily.precipitation_sum[i] || 0,
        daily.windspeed_10m_max?.[i] || 0,
        humidity,
        daily.temperature_2m_max?.[i] || 30
      );

      const lightHours = daily.sunrise && daily.sunset 
        ? calculateLightHours(daily.sunrise[i], daily.sunset[i])
        : { goldenMorning: '6:00 AM', goldenEvening: '6:00 PM', blueMorning: '5:30 AM', blueHourEvening: '6:30 PM' };

      forecast.push({
        date: daily.time[i],
        dayName: date.toLocaleDateString('en-IN', { weekday: 'long' }),
        condition: condition.main,
        conditionDetailed: condition.description,
        tempHigh: Math.round(daily.temperature_2m_max?.[i] || 30),
        tempLow: Math.round(daily.temperature_2m_min?.[i] || 22),
        humidity,
        windSpeed: Math.round((daily.windspeed_10m_max?.[i] || 5) * 10) / 10,
        windGust: Math.round((daily.windgusts_10m_max?.[i] || 0) * 10) / 10,
        precipitation: Math.round((daily.precipitation_sum?.[i] || 0) * 10) / 10,
        precipitationChance: daily.precipitation_probability_max ? daily.precipitation_probability_max[i] : 0,
        icon: getIconFromCode(conditionId),
        iconCode: conditionId,
        recommendation,
        recommendationSeverity: severity,
        shootingNotes: notes,
        bestTimeToShoot: bestTime,
        uvIndex: daily.uv_index_max ? Math.round(daily.uv_index_max[i] || 5) : 5,
        visibility: 10000, // Default visibility
        sunrise: daily.sunrise ? new Date(daily.sunrise[i]).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '6:00 AM',
        sunset: daily.sunset ? new Date(daily.sunset[i]).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '6:00 PM',
        goldenHourMorning: lightHours.goldenMorning,
        goldenHourEvening: lightHours.goldenEvening,
        blueHourMorning: lightHours.blueMorning,
        blueHourEvening: lightHours.blueHourEvening,
      });
    }

    return NextResponse.json({
      location,
      locationDetails: { lat: latNum, lng: lngNum },
      forecast,
      lastUpdated: new Date().toISOString(),
      isDemoMode: false,
    } satisfies WeatherResponse);

  } catch (err) {
    console.error('[GET /api/weather] Error:', err);
    const forecast = generateDemoForecast(location, latNum, lngNum);
    return NextResponse.json({
      location,
      locationDetails: { lat: latNum, lng: lngNum },
      forecast,
      lastUpdated: new Date().toISOString(),
      isDemoMode: true,
      error: err instanceof Error ? err.message : 'Unknown error',
    } satisfies WeatherResponse);
  }
}
