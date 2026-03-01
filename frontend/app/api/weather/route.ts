import { NextRequest, NextResponse } from 'next/server';

interface OpenWeatherItem {
  dt: number;
  main: {
    temp: number;
    temp_min: number;
    temp_max: number;
    humidity: number;
    pressure: number;
  };
  weather: Array<{ main: string; description: string; icon: string; id: number }>;
  wind: { speed: number; gust?: number };
  rain?: { '3h'?: number };
  snow?: { '3h'?: number };
  sys?: { sunrise: number; sunset: number };
  visibility?: number;
}

interface OpenWeatherResponse {
  list: OpenWeatherItem[];
  city?: { name: string; sunrise: number; sunset: number };
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
  isDemo?: boolean;
  error?: string;
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

  // Thunderstorm (200-232)
  if (conditionId >= 200 && conditionId < 300) {
    severity = 'red';
    recommendation = '⛔ Thunderstorms — NO outdoor shooting';
    notes.push('All outdoor units must stand down');
    notes.push('Move to indoor backup locations');
    notes.push('Secure equipment from rain/lightning');
    notes.push('Consider scene changes to interior');
  }
  // Drizzle (300-321) & Rain (500-531)
  else if ((conditionId >= 300 && conditionId < 400) || (conditionId >= 500 && conditionId < 600)) {
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
  // Snow (600-622)
  else if (conditionId >= 600 && conditionId < 700) {
    severity = 'red';
    recommendation = '⛔ Snow conditions — Not recommended';
    notes.push('Travel may be hazardous');
    notes.push('Equipment may malfunction');
    notes.push('Consider indoor/studio alternatives');
  }
  // Atmosphere (701-781) - fog, mist, haze
  else if (conditionId >= 700 && conditionId < 800) {
    severity = 'amber';
    recommendation = '⚠️ Reduced visibility — Atmospheric shots possible';
    notes.push('Great for moody/atmospheric scenes');
    notes.push('Longer lenses for compression');
    notes.push('Safety: extra crew for traffic control');
    notes.push('Check fog equipment if needed');
    bestTime = 'Mid-day when fog lifts';
  }
  // Clear (800)
  else if (conditionId === 800) {
    severity = 'green';
    recommendation = '✅ Perfect conditions for outdoor shooting';
    notes.push('Ideal lighting all day');
    notes.push('Schedule exteriors with confidence');
    notes.push('Sun protection for crew');
  }
  // Clouds (801-804)
  else if (conditionId >= 801 && conditionId < 900) {
    severity = conditionId === 804 ? 'green' : 'green';
    recommendation = conditionId <= 802 
      ? '✅ Clear skies with some clouds — Great for shooting'
      : '⚠️ Overcast — Soft light, good for close-ups';
    notes.push('Natural diffusion from clouds');
    notes.push('Even lighting reduces harsh shadows');
    notes.push('Good for detail shots');
    if (conditionId >= 803) {
      notes.push('May need additional lighting for wide shots');
    }
    bestTime = conditionId <= 802 ? 'Any time' : 'Mid-day preferred';
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

// Calculate golden hour and blue hour
function calculateLightHours(sunriseTs: number, sunsetTs: number): { goldenMorning: string; goldenEvening: string; blueMorning: string; blueEvening: string } {
  const goldenHourDuration = 60 * 60; // 1 hour in seconds
  const blueHourDuration = 30 * 60; // 30 minutes in seconds

  return {
    goldenMorning: new Date(sunriseTs * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    goldenEvening: new Date((sunsetTs - goldenHourDuration) * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    blueMorning: new Date((sunriseTs - blueHourDuration) * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
    blueEvening: new Date((sunsetTs) * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
}

// Demo data for when API key is not available
function generateDemoForecast(locationName: string, lat: number, lng: number): WeatherForecastDay[] {
  const conditions = [
    { main: 'Clear', id: 800, desc: 'clear sky' },
    { main: 'Clouds', id: 801, desc: 'few clouds' },
    { main: 'Clear', id: 800, desc: 'clear sky' },
    { main: 'Clouds', id: 802, desc: 'scattered clouds' },
    { main: 'Clear', id: 800, desc: 'clear sky' },
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
    const precipChance = condition.main === 'Clouds' ? Math.round(20 + Math.random() * 30) : Math.round(Math.random() * 15);

    const { recommendation, severity, notes, bestTime } = getShootingRecommendation(
      condition.main,
      condition.id,
      0,
      windSpeed,
      humidity,
      tempHigh
    );

    // Generate mock sunrise/sunset times - calculate from midnight of the target date
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    const midnightTs = Math.floor(targetDate.getTime() / 1000);
    const sunriseTs = midnightTs + (6 * 3600) + Math.floor(Math.random() * 1800); // ~6:00 AM
    const sunsetTs = midnightTs + (18 * 3600) + Math.floor(Math.random() * 1800); // ~6:00 PM
    const lightHours = calculateLightHours(sunriseTs, sunsetTs);

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
      precipitation: condition.main === 'Clouds' ? Math.round(Math.random() * 2) : 0,
      precipitationChance: precipChance,
      icon: condition.main === 'Clear' ? '01d' : '03d',
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
      blueHourEvening: lightHours.blueEvening,
    });
  }

  return forecast;
}

export async function GET(req: NextRequest) {
  const apiKey = process.env.OPENWEATHERMAP_API_KEY;
  const useDemo = !apiKey || apiKey === 'your-openweathermap-key' || apiKey === 'demo';

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

  // Use demo data if API key is not configured properly
  if (useDemo) {
    console.log('[GET /api/weather] Using demo data (no API key configured)');
    const forecast = generateDemoForecast(location, latNum, lngNum);
    return NextResponse.json({
      location,
      locationDetails: { lat: latNum, lng: lngNum },
      forecast,
      lastUpdated: new Date().toISOString(),
      isDemo: true,
    } satisfies WeatherResponse);
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${latNum}&lon=${lngNum}&appid=${apiKey}&units=metric`;
    const res = await fetch(url);

    if (!res.ok) {
      const errText = await res.text();
      console.error('[GET /api/weather] OpenWeatherMap error:', res.status, errText);
      const forecast = generateDemoForecast(location, latNum, lngNum);
      return NextResponse.json({
        location,
        locationDetails: { lat: latNum, lng: lngNum },
        forecast,
        lastUpdated: new Date().toISOString(),
        isDemo: true,
        error: 'API call failed, using demo data',
      } satisfies WeatherResponse);
    }

    const data: OpenWeatherResponse = await res.json();

    // Group by day
    const byDay = new Map<
      string,
      {
        temps: number[];
        humiditySum: number;
        humidityCount: number;
        windSum: number;
        windGustMax: number;
        windCount: number;
        precipitation: number;
        precipitationChance: number;
        condition: string;
        conditionDetailed: string;
        icon: string;
        conditionId: number;
        pressures: number[];
        visibilities: number[];
      }
    >();

    // Also track first/last timestamps for sunrise/sunset
    const dayTimestamps: Map<string, { sunrise?: number; sunset?: number }> = new Map();

    for (const item of data.list) {
      const date = new Date(item.dt * 1000).toISOString().split('T')[0];
      let existing = byDay.get(date);
      if (!existing) {
        existing = {
          temps: [],
          humiditySum: 0,
          humidityCount: 0,
          windSum: 0,
          windGustMax: 0,
          windCount: 0,
          precipitation: 0,
          precipitationChance: 0,
          condition: item.weather[0]?.main ?? 'Unknown',
          conditionDetailed: item.weather[0]?.description ?? 'unknown',
          icon: item.weather[0]?.icon ?? '01d',
          conditionId: item.weather[0]?.id ?? 800,
          pressures: [],
          visibilities: [],
        };
        byDay.set(date, existing);
      }

      existing.temps.push(item.main.temp);
      existing.humiditySum += item.main.humidity;
      existing.humidityCount += 1;
      existing.windSum += item.wind.speed;
      existing.windGustMax = Math.max(existing.windGustMax, item.wind.gust || 0);
      existing.windCount += 1;
      existing.precipitation += item.rain?.['3h'] ?? 0;
      existing.precipitation += item.snow?.['3h'] ?? 0;
      
      // Precipitation chance based on weather condition
      if (item.weather[0]) {
        const id = item.weather[0].id;
        if (id >= 200 && id < 600) existing.precipitationChance = Math.max(existing.precipitationChance, 80);
        else if (id >= 600 && id < 700) existing.precipitationChance = Math.max(existing.precipitationChance, 70);
        else if (id >= 700 && id < 800) existing.precipitationChance = Math.max(existing.precipitationChance, 40);
        else if (id === 800) existing.precipitationChance = Math.max(existing.precipitationChance, 10);
        else if (id > 800) existing.precipitationChance = Math.max(existing.precipitationChance, 30);
      }
      
      if (item.weather[0] && (item.weather[0].id >= 200 && item.weather[0].id < 800)) {
        existing.condition = item.weather[0].main;
        existing.conditionDetailed = item.weather[0].description;
        existing.icon = item.weather[0].icon;
        existing.conditionId = item.weather[0].id;
      }

      existing.pressures.push(item.main.pressure);
      existing.visibilities.push(item.visibility || 10000);
    }

    // Use city sunrise/sunset for first day
    const citySunrise = data.city?.sunrise || Math.floor(Date.now() / 1000) + (6 * 3600);
    const citySunset = data.city?.sunset || Math.floor(Date.now() / 1000) + (18 * 3600);

    const forecast: WeatherForecastDay[] = [];
    const sortedDates = Array.from(byDay.keys()).sort();

    for (let i = 0; i < sortedDates.length && i < 5; i++) {
      const date = sortedDates[i];
      const d = byDay.get(date)!;
      const tempHigh = Math.round(Math.max(...d.temps));
      const tempLow = Math.round(Math.min(...d.temps));
      const humidity = Math.round(d.humiditySum / d.humidityCount);
      const windSpeed = d.windSum / d.windCount;
      const windGust = d.windGustMax;
      const precipitation = Math.round(d.precipitation * 10) / 10;

      const { recommendation, severity, notes, bestTime } = getShootingRecommendation(
        d.condition,
        d.conditionId,
        precipitation,
        windSpeed,
        humidity,
        tempHigh
      );

      const avgPressure = d.pressures.reduce((a, b) => a + b, 0) / d.pressures.length;
      const avgVisibility = d.visibilities.reduce((a, b) => a + b, 0) / d.visibilities.length;
      
      // Estimate UV index based on cloud cover and time of year
      const uvBase = d.conditionId === 800 ? 8 : d.conditionId === 801 ? 6 : d.conditionId >= 802 ? 3 : 5;
      const uvIndex = uvBase;

      const lightHours = calculateLightHours(citySunrise, citySunset);

      forecast.push({
        date,
        dayName: new Date(date).toLocaleDateString('en-IN', { weekday: 'long' }),
        condition: d.condition,
        conditionDetailed: d.conditionDetailed,
        tempHigh,
        tempLow,
        humidity,
        windSpeed: Math.round(windSpeed * 10) / 10,
        windGust: Math.round(windGust * 10) / 10,
        precipitation,
        precipitationChance: d.precipitationChance,
        icon: d.icon,
        iconCode: d.conditionId,
        recommendation,
        recommendationSeverity: severity,
        shootingNotes: notes,
        bestTimeToShoot: bestTime,
        uvIndex,
        visibility: Math.round(avgVisibility),
        sunrise: new Date(citySunrise * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        sunset: new Date(citySunset * 1000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
        goldenHourMorning: lightHours.goldenMorning,
        goldenHourEvening: lightHours.goldenEvening,
        blueHourMorning: lightHours.blueMorning,
        blueHourEvening: lightHours.blueEvening,
      });
    }

    const locationName = location || data.city?.name || `${latNum.toFixed(2)}, ${lngNum.toFixed(2)}`;

    return NextResponse.json({
      location: locationName,
      locationDetails: { lat: latNum, lng: lngNum },
      forecast,
      lastUpdated: new Date().toISOString(),
    } satisfies WeatherResponse);
  } catch (error) {
    console.error('[GET /api/weather]', error);
    const forecast = generateDemoForecast(location, latNum, lngNum);
    return NextResponse.json({
      location,
      locationDetails: { lat: latNum, lng: lngNum },
      forecast,
      lastUpdated: new Date().toISOString(),
      isDemo: true,
      error: 'Using demo data - API call failed',
    } satisfies WeatherResponse);
  }
}
