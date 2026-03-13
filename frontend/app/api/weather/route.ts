import { NextRequest, NextResponse } from 'next/server';

interface SavedLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  isDefault: boolean;
  createdAt: string;
}

// In-memory storage for saved locations (demo mode)
const savedLocations: SavedLocation[] = [
  {
    id: 'loc-1',
    name: 'Chennai, Tamil Nadu',
    lat: 13.0827,
    lng: 80.2707,
    isDefault: true,
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'loc-2',
    name: 'Ooty, Tamil Nadu',
    lat: 11.4102,
    lng: 76.6950,
    isDefault: false,
    createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'loc-3',
    name: 'Madurai, Tamil Nadu',
    lat: 9.9252,
    lng: 78.1198,
    isDefault: false,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

interface OpenMeteoDaily {
  time: string[];
  temperature_2m_max: number[];
  temperature_2m_min: number[];
  relative_humidity_2m_max: number[];
  wind_speed_10m_max: number[];
  precipitation_sum: number[];
  weather_code: number[];
}

interface OpenMeteoHourly {
  time: string[];
  temperature_2m: number[];
  relative_humidity_2m: number[];
  wind_speed_10m: number[];
  precipitation_probability: number[];
  precipitation: number[];
  weather_code: number[];
  cloud_cover: number[];
  visibility: number[];
}

interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  daily: OpenMeteoDaily;
  hourly?: OpenMeteoHourly;
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

export interface HourlyWeatherData {
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

export interface HourlyWeatherResponse {
  location: string;
  lat: number;
  lng: number;
  date: string;
  hourly: HourlyWeatherData[];
  isDemo?: boolean;
  error?: string;
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

function getHourlyShootingRecommendation(
  condition: string,
  precipitation: number,
  precipitationChance: number,
  windSpeed: number,
  humidity: number,
  cloudCover: number,
  visibility: number
): string {
  const conditionLower = condition.toLowerCase();
  const windKmh = windSpeed;

  // Visibility check (in meters)
  if (visibility < 1000) {
    return '🌫️ Very low visibility — atmospheric shots only, plan indoor alternatives';
  }
  if (visibility < 3000) {
    return '🌫️ Reduced visibility — good for moody scenes, consider timing';
  }

  // Thunderstorm check
  if (conditionLower.includes('thunderstorm')) {
    return '⛈️ Thunderstorms — avoid outdoor shooting, plan indoor alternatives';
  }

  // Snow check
  if (conditionLower.includes('snow')) {
    return '❄️ Snow conditions — plan indoor alternatives or winter gear';
  }

  // Rain check
  if (precipitation > 5 || precipitationChance > 70 || conditionLower.includes('rain') || conditionLower.includes('drizzle')) {
    return '🌧️ High rain chance — plan indoor alternatives';
  }
  if (precipitation > 0 || precipitationChance > 40 || conditionLower.includes('showers')) {
    return '🌦️ Possible rain — have indoor backup ready';
  }

  // Wind check
  if (windKmh > 40) {
    return '💨 Dangerous winds — avoid outdoor, secure equipment';
  }
  if (windKmh > 25) {
    return '💨 Strong winds — use wind protection, secure lighting';
  }
  if (windKmh > 15) {
    return '💨 Moderate winds — watch for sound issues';
  }

  // Humidity check
  if (humidity > 90) {
    return '💧 Very humid — equipment concerns, plan accordingly';
  }
  if (humidity > 80) {
    return '💧 High humidity — monitor equipment';
  }

  // Cloud cover for filming
  if (cloudCover > 80) {
    return '☁️ Overcast — excellent for even lighting, no harsh shadows';
  }
  if (cloudCover > 50) {
    return '⛅ Partly cloudy — good conditions, watch for changing light';
  }

  // Clear skies
  if (conditionLower.includes('clear') || conditionLower.includes('sunny')) {
    if (humidity < 60 && windKmh < 15) {
      return '☀️ Perfect conditions — ideal for outdoor shooting';
    }
    return '☀️ Clear skies — good for filming';
  }

  return '✅ Suitable for filming';
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

// Generate demo hourly data for a specific date
function generateDemoHourlyForecast(locationName: string, dateStr: string): HourlyWeatherData[] {
  const hourly: HourlyWeatherData[] = [];
  const baseDate = new Date(dateStr);
  
  // Simulate realistic daily weather pattern
  const isRainyDay = Math.random() > 0.7;
  const baseTemp = 25 + Math.random() * 8; // 25-33°C
  
  for (let hour = 0; hour < 24; hour++) {
    // Temperature curve: coldest at 5am, hottest at 2pm
    const hourFactor = Math.sin((hour - 5) * Math.PI / 12);
    const temperature = Math.round(baseTemp + hourFactor * 6);
    
    // Humidity inversely related to temperature
    const humidity = Math.round(70 - hourFactor * 20 + Math.random() * 10);
    
    // Wind varies throughout day
    const windSpeed = Math.round(8 + Math.random() * 12 + Math.max(0, hourFactor * 10));
    
    // Rain pattern
    let precipitationChance = 0;
    let precipitation = 0;
    let condition = 'Clear';
    let icon = '01d';
    
    if (isRainyDay) {
      // Rain more likely afternoon/evening
      if (hour >= 14 && hour <= 20) {
        precipitationChance = Math.round(50 + Math.random() * 40);
        precipitation = precipitationChance > 50 ? Math.round(Math.random() * 8) : 0;
        condition = precipitation > 3 ? 'Rain' : 'Showers';
        icon = '10d';
      } else if (hour >= 10) {
        precipitationChance = Math.round(Math.random() * 30);
        condition = precipitationChance > 15 ? 'Cloudy' : 'Partly Cloudy';
        icon = '02d';
      }
    } else {
      // Clear day with some clouds
      if (hour >= 10 && hour <= 16) {
        condition = hour % 3 === 0 ? 'Partly Cloudy' : 'Clear';
        icon = condition === 'Clear' ? '01d' : '02d';
      } else {
        condition = 'Clear';
        icon = '01d';
      }
    }
    
    // Cloud cover follows temperature pattern
    const cloudCover = condition === 'Clear' ? Math.round(Math.random() * 20) : 
                       condition === 'Partly Cloudy' ? Math.round(30 + Math.random() * 30) :
                       Math.round(60 + Math.random() * 30);
    
    // Visibility better in clear conditions
    const visibility = condition === 'Clear' ? Math.round(9000 + Math.random() * 1000) :
                      Math.round(6000 + Math.random() * 2000);
    
    const timeStr = baseDate.toISOString().split('T')[0] + ' ' + 
                   hour.toString().padStart(2, '0') + ':00';
    
    hourly.push({
      hour: hour.toString().padStart(2, '0') + ':00',
      time: timeStr,
      temperature,
      humidity: Math.max(30, Math.min(95, humidity)),
      windSpeed: Math.max(0, windSpeed),
      precipitationChance,
      precipitation: Math.round(precipitation * 10) / 10,
      cloudCover,
      visibility,
      condition,
      icon,
      recommendation: getHourlyShootingRecommendation(
        condition, precipitation, precipitationChance, windSpeed, humidity, cloudCover, visibility
      ),
    });
  }
  
  return hourly;
}

export async function GET(req: NextRequest) {
  // Get lat/lng from query params, fall back to defaults
  let lat = req.nextUrl.searchParams.get('lat');
  let lng = req.nextUrl.searchParams.get('lng');
  let location = req.nextUrl.searchParams.get('location');
  const type = req.nextUrl.searchParams.get('type');
  const dateParam = req.nextUrl.searchParams.get('date');

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

  // Handle hourly forecast request
  if (type === 'hourly') {
    // Determine which date to get hourly data for
    let targetDate: Date;
    if (dateParam) {
      targetDate = new Date(dateParam);
      if (isNaN(targetDate.getTime())) {
        return NextResponse.json(
          { error: 'Invalid date format. Use YYYY-MM-DD' },
          { status: 400 }
        );
      }
    } else {
      // Default to today
      targetDate = new Date();
    }

    const dateStr = targetDate.toISOString().split('T')[0];

    try {
      // Fetch hourly data from Open-Meteo
      const url = `https://api.open-meteo.com/v1/forecast?latitude=${latNum}&longitude=${lngNum}&hourly=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation_probability,precipitation,weather_code,cloud_cover,visibility&timezone=auto&forecast_days=7`;
      
      const res = await fetch(url);

      if (!res.ok) {
        const errText = await res.text();
        console.error('[GET /api/weather hourly] Open-Meteo error:', res.status, errText);
        // Fall back to demo hourly data
        const hourly = generateDemoHourlyForecast(location, dateStr);
        return NextResponse.json({
          location,
          lat: latNum,
          lng: lngNum,
          date: dateStr,
          hourly,
          isDemo: true,
          error: 'Using demo data - API call failed',
        } satisfies HourlyWeatherResponse);
      }

      const data: OpenMeteoResponse = await res.json();
      
      if (!data.hourly) {
        // Fall back to demo hourly data if no hourly data available
        const hourly = generateDemoHourlyForecast(location, dateStr);
        return NextResponse.json({
          location,
          lat: latNum,
          lng: lngNum,
          date: dateStr,
          hourly,
          isDemo: true,
          error: 'Using demo data - No hourly data available',
        } satisfies HourlyWeatherResponse);
      }

      // Find the index of the target date in the hourly data
      const hourlyData: HourlyWeatherData[] = [];
      const targetDateStr = targetDate.toISOString().split('T')[0];
      
      for (let i = 0; i < data.hourly.time.length; i++) {
        const hourDateTime = data.hourly.time[i];
        if (hourDateTime.startsWith(targetDateStr)) {
          const hour = new Date(hourDateTime).getHours();
          const weatherInfo = getWeatherCondition(data.hourly.weather_code[i]);
          
          hourlyData.push({
            hour: hour.toString().padStart(2, '0') + ':00',
            time: hourDateTime,
            temperature: Math.round(data.hourly.temperature_2m[i]),
            humidity: Math.round(data.hourly.relative_humidity_2m[i] || 0),
            windSpeed: Math.round(data.hourly.wind_speed_10m[i] || 0),
            precipitationChance: Math.round(data.hourly.precipitation_probability[i] || 0),
            precipitation: Math.round((data.hourly.precipitation[i] || 0) * 10) / 10,
            cloudCover: Math.round(data.hourly.cloud_cover[i] || 0),
            visibility: Math.round(data.hourly.visibility[i] || 10000),
            condition: weatherInfo.condition,
            icon: weatherInfo.icon,
            recommendation: getHourlyShootingRecommendation(
              weatherInfo.condition,
              data.hourly.precipitation[i] || 0,
              data.hourly.precipitation_probability[i] || 0,
              data.hourly.wind_speed_10m[i] || 0,
              data.hourly.relative_humidity_2m[i] || 0,
              data.hourly.cloud_cover[i] || 0,
              data.hourly.visibility[i] || 10000
            ),
          });
        }
      }

      // If no data for the target date, generate demo data
      if (hourlyData.length === 0) {
        const hourly = generateDemoHourlyForecast(location, dateStr);
        return NextResponse.json({
          location,
          lat: latNum,
          lng: lngNum,
          date: dateStr,
          hourly,
          isDemo: true,
          error: 'Using demo data - No data for selected date',
        } satisfies HourlyWeatherResponse);
      }

      return NextResponse.json({
        location,
        lat: latNum,
        lng: lngNum,
        date: dateStr,
        hourly: hourlyData,
      } satisfies HourlyWeatherResponse);
    } catch (error) {
      console.error('[GET /api/weather hourly]', error);
      // Fall back to demo hourly data on any error
      const hourly = generateDemoHourlyForecast(location, dateStr);
      return NextResponse.json({
        location,
        lat: latNum,
        lng: lngNum,
        date: dateStr,
        hourly,
        isDemo: true,
        error: 'Using demo data - API call failed',
      } satisfies HourlyWeatherResponse);
    }
  }

  // Default: daily forecast
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

// POST /api/weather - Manage saved locations
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    switch (action) {
      case 'saveLocation': {
        // Save a new location
        const { name, lat, lng, isDefault } = body;
        
        if (!name || lat === undefined || lng === undefined) {
          return NextResponse.json(
            { error: 'Missing required fields: name, lat, lng' },
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

        // If this is default, unset other defaults
        if (isDefault) {
          savedLocations.forEach(loc => loc.isDefault = false);
        }

        const newLocation: SavedLocation = {
          id: `loc-${Date.now()}`,
          name,
          lat: latNum,
          lng: lngNum,
          isDefault: isDefault || savedLocations.length === 0,
          createdAt: new Date().toISOString(),
        };

        savedLocations.push(newLocation);

        return NextResponse.json({
          success: true,
          location: newLocation,
        });
      }

      case 'getLocations': {
        // Get all saved locations
        return NextResponse.json({
          locations: savedLocations,
          defaultLocation: savedLocations.find(l => l.isDefault) || savedLocations[0],
        });
      }

      case 'deleteLocation': {
        // Delete a saved location
        const { id } = body;
        
        if (!id) {
          return NextResponse.json(
            { error: 'Missing required field: id' },
            { status: 400 }
          );
        }

        const index = savedLocations.findIndex(l => l.id === id);
        if (index === -1) {
          return NextResponse.json(
            { error: 'Location not found' },
            { status: 404 }
          );
        }

        const deleted = savedLocations.splice(index, 1)[0];

        // If deleted was default, set a new default
        if (deleted.isDefault && savedLocations.length > 0) {
          savedLocations[0].isDefault = true;
        }

        return NextResponse.json({
          success: true,
          deleted,
        });
      }

      case 'setDefault': {
        // Set a location as default
        const { id } = body;
        
        if (!id) {
          return NextResponse.json(
            { error: 'Missing required field: id' },
            { status: 400 }
          );
        }

        const location = savedLocations.find(l => l.id === id);
        if (!location) {
          return NextResponse.json(
            { error: 'Location not found' },
            { status: 404 }
          );
        }

        savedLocations.forEach(l => l.isDefault = false);
        location.isDefault = true;

        return NextResponse.json({
          success: true,
          defaultLocation: location,
        });
      }

      case 'reset': {
        // Reset to demo locations
        savedLocations.length = 0;
        savedLocations.push(
          {
            id: 'loc-1',
            name: 'Chennai, Tamil Nadu',
            lat: 13.0827,
            lng: 80.2707,
            isDefault: true,
            createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'loc-2',
            name: 'Ooty, Tamil Nadu',
            lat: 11.4102,
            lng: 76.6950,
            isDefault: false,
            createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString(),
          },
          {
            id: 'loc-3',
            name: 'Madurai, Tamil Nadu',
            lat: 9.9252,
            lng: 78.1198,
            isDefault: false,
            createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
          }
        );

        return NextResponse.json({
          success: true,
          locations: savedLocations,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('[POST /api/weather]', error);
    return NextResponse.json(
      { error: 'Invalid request body' },
      { status: 400 }
    );
  }
}
