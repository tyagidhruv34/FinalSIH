import { NextRequest, NextResponse } from 'next/server';

// Weather alert types
interface WeatherAlert {
  id: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  type: string;
  location: string;
  issuedBy: string;
  validUntil: string;
  timestamp: string;
  source: 'IMD' | 'OpenMeteo';
  temperature?: number;
  precipitation?: number;
  windSpeed?: number;
}

// Open-Meteo API response types
interface OpenMeteoResponse {
  current_weather: {
    temperature: number;
    windspeed: number;
    winddirection: number;
    weathercode: number;
    time: string;
  };
  daily: {
    time: string[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    weathercode: number[];
    windspeed_10m_max: number[];
  };
  daily_units: {
    temperature_2m_max: string;
    temperature_2m_min: string;
    precipitation_sum: string;
    windspeed_10m_max: string;
  };
}

// Weather code mapping (WMO Weather interpretation codes)
const weatherCodeMap: { [key: number]: { description: string; severity: 'Low' | 'Medium' | 'High' | 'Critical' } } = {
  0: { description: 'Clear sky', severity: 'Low' },
  1: { description: 'Mainly clear', severity: 'Low' },
  2: { description: 'Partly cloudy', severity: 'Low' },
  3: { description: 'Overcast', severity: 'Low' },
  45: { description: 'Fog', severity: 'Low' },
  48: { description: 'Depositing rime fog', severity: 'Low' },
  51: { description: 'Light drizzle', severity: 'Low' },
  53: { description: 'Moderate drizzle', severity: 'Medium' },
  55: { description: 'Dense drizzle', severity: 'Medium' },
  56: { description: 'Light freezing drizzle', severity: 'Medium' },
  57: { description: 'Dense freezing drizzle', severity: 'High' },
  61: { description: 'Slight rain', severity: 'Low' },
  63: { description: 'Moderate rain', severity: 'Medium' },
  65: { description: 'Heavy rain', severity: 'High' },
  66: { description: 'Light freezing rain', severity: 'Medium' },
  67: { description: 'Heavy freezing rain', severity: 'Critical' },
  71: { description: 'Slight snow fall', severity: 'Low' },
  73: { description: 'Moderate snow fall', severity: 'Medium' },
  75: { description: 'Heavy snow fall', severity: 'High' },
  77: { description: 'Snow grains', severity: 'Low' },
  80: { description: 'Slight rain showers', severity: 'Low' },
  81: { description: 'Moderate rain showers', severity: 'Medium' },
  82: { description: 'Violent rain showers', severity: 'Critical' },
  85: { description: 'Slight snow showers', severity: 'Low' },
  86: { description: 'Heavy snow showers', severity: 'High' },
  95: { description: 'Thunderstorm', severity: 'High' },
  96: { description: 'Thunderstorm with slight hail', severity: 'High' },
  99: { description: 'Thunderstorm with heavy hail', severity: 'Critical' },
};

// Fetch weather alerts from Open-Meteo API (real-time, no caching)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const lat = searchParams.get('lat') || '28.6139'; // Default to Delhi
    const lon = searchParams.get('lon') || '77.2090';
    const cityName = searchParams.get('city') || '';
    const countryName = searchParams.get('country') || '';
    
    // Force real-time fetch with no caching
    const weatherAlerts: WeatherAlert[] = await fetchWeatherAlerts(lat, lon, cityName, countryName);
    
    return NextResponse.json({
      success: true,
      alerts: weatherAlerts,
      timestamp: new Date().toISOString(),
      location: cityName || `${lat}, ${lon}`,
      realTime: true, // Indicate this is real-time data
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store',
      }
    });
  } catch (error: any) {
    console.error('Error fetching weather alerts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch weather alerts',
      },
      { 
        status: 500,
        headers: {
          'Cache-Control': 'no-store',
        }
      }
    );
  }
}

async function fetchWeatherAlerts(lat: string, lon: string, cityName: string = '', countryName: string = ''): Promise<WeatherAlert[]> {
  const alerts: WeatherAlert[] = [];
  
  // Weather Map API Key (OpenWeatherMap)
  const weatherMapApiKey = process.env.WEATHER_MAP_API_KEY || 'c7836e6f71da09d60e0a00f506446f5d';
  
  try {
    // Fetch current weather from OpenWeatherMap for real-time data
    let currentWeatherData: any = null;
    try {
      const openWeatherUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${weatherMapApiKey}&units=metric&t=${Date.now()}`;
      const openWeatherResponse = await fetch(openWeatherUrl, {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        }
      });
      
      if (openWeatherResponse.ok) {
        currentWeatherData = await openWeatherResponse.json();
      }
    } catch (error) {
      console.log('OpenWeatherMap API not available, using Open-Meteo');
    }
    
    // Fetch current weather and 7-day forecast from Open-Meteo (real-time)
    // Add timestamp to prevent caching and get live data
    const timestamp = Date.now();
    const apiUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,windspeed_10m_max&timezone=Asia%2FKolkata&forecast_days=7&t=${timestamp}`;
    
    const response = await fetch(apiUrl, {
      cache: 'no-store', // Always fetch fresh real-time data
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      next: { revalidate: 0 } // Disable Next.js caching completely
    });
    
    if (!response.ok) {
      throw new Error(`Open-Meteo API error: ${response.statusText}`);
    }
    
    const data: OpenMeteoResponse = await response.json();
    
    const current = data.current_weather;
    const daily = data.daily;
    const today = daily.time[0];
    const tomorrow = daily.time[1];
    
    // Use provided city name or get from geocoding API
    let locationName = cityName;
    if (!locationName) {
      locationName = await getLocationName(lat, lon);
    } else if (countryName) {
      locationName = `${cityName}, ${countryName}`;
    }
    
    // Use OpenWeatherMap data if available for more accurate current conditions
    const currentTemp = currentWeatherData?.main?.temp || current.temperature;
    const currentWind = currentWeatherData?.wind?.speed ? currentWeatherData.wind.speed * 3.6 : current.windspeed; // Convert m/s to km/h
    const currentHumidity = currentWeatherData?.main?.humidity || null;
    const currentPressure = currentWeatherData?.main?.pressure || null;
    
    // Always show current weather conditions (even if not severe)
    alerts.push({
      id: `weather-${Date.now()}-current-conditions`,
      title: `Current Weather: ${locationName}`,
      description: `Temperature: ${currentTemp.toFixed(1)}°C, Wind: ${currentWind.toFixed(1)} km/h${currentHumidity ? `, Humidity: ${currentHumidity}%` : ''}${currentPressure ? `, Pressure: ${currentPressure} hPa` : ''}. Weather conditions are being monitored in real-time.`,
      severity: 'Low',
      type: 'Current Conditions',
      location: locationName,
      issuedBy: 'Real-time Weather Monitoring',
      validUntil: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString(), // Valid for 1 hour
      timestamp: new Date().toISOString(),
      source: currentWeatherData ? 'OpenWeatherMap' : 'OpenMeteo',
      temperature: currentTemp,
      windSpeed: currentWind,
    });
    
    // 1. Current Weather Alerts based on weather code
    const currentWeatherCode = current.weathercode;
    const weatherInfo = weatherCodeMap[currentWeatherCode] || { description: 'Unknown', severity: 'Low' };
    
    if (weatherInfo.severity === 'High' || weatherInfo.severity === 'Critical') {
      alerts.push({
        id: `weather-${Date.now()}-current-severe`,
        title: `⚠️ Active ${weatherInfo.description}`,
        description: `Current severe weather conditions: ${weatherInfo.description.toLowerCase()}. Temperature: ${currentTemp.toFixed(1)}°C, Wind: ${currentWind.toFixed(1)} km/h. Take immediate precautions and avoid outdoor activities.`,
        severity: weatherInfo.severity,
        type: getWeatherType(currentWeatherCode),
        location: locationName,
        issuedBy: 'India Meteorological Department (IMD) via Open-Meteo',
        validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // Valid for 6 hours
        timestamp: new Date().toISOString(),
        source: 'OpenMeteo',
        temperature: currentTemp,
        windSpeed: currentWind,
      });
    }
    
    // 2. Temperature Alerts
    const maxTempToday = daily.temperature_2m_max[0];
    const minTempToday = daily.temperature_2m_min[0];
    const maxTempTomorrow = daily.temperature_2m_max[1];
    
    // Heat wave alert (temperature > 40°C)
    if (maxTempToday >= 40 || maxTempTomorrow >= 40) {
      alerts.push({
        id: `weather-${Date.now()}-heat`,
        title: 'Heat Wave Warning',
        description: `Extreme temperatures expected. Maximum temperature: ${maxTempToday}°C today, ${maxTempTomorrow}°C tomorrow. Stay hydrated, avoid direct sunlight during peak hours (10 AM - 4 PM), and take necessary precautions.`,
        severity: maxTempToday >= 45 ? 'Critical' : maxTempToday >= 42 ? 'High' : 'Medium',
        type: 'Temperature',
        location: locationName,
        issuedBy: 'India Meteorological Department (IMD) via Open-Meteo',
        validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        timestamp: new Date().toISOString(),
        source: 'OpenMeteo',
        temperature: maxTempToday,
      });
    }
    
    // Cold wave alert (temperature < 5°C)
    if (minTempToday <= 5) {
      alerts.push({
        id: `weather-${Date.now()}-cold`,
        title: 'Cold Wave Warning',
        description: `Cold temperatures expected. Minimum temperature: ${minTempToday}°C. Stay warm, wear appropriate clothing, and take care of vulnerable populations.`,
        severity: minTempToday <= 0 ? 'High' : 'Medium',
        type: 'Temperature',
        location: locationName,
        issuedBy: 'India Meteorological Department (IMD) via Open-Meteo',
        validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        timestamp: new Date().toISOString(),
        source: 'OpenMeteo',
        temperature: minTempToday,
      });
    }
    
    // 3. Precipitation Alerts
    const precipitationToday = daily.precipitation_sum[0];
    const precipitationTomorrow = daily.precipitation_sum[1];
    const maxPrecipitation = Math.max(precipitationToday, precipitationTomorrow);
    
    // Heavy rainfall alert (> 50mm in 24 hours)
    if (maxPrecipitation >= 50) {
      alerts.push({
        id: `weather-${Date.now()}-rain`,
        title: 'Heavy Rainfall Warning',
        description: `Heavy rainfall expected: ${precipitationToday.toFixed(1)}mm today, ${precipitationTomorrow.toFixed(1)}mm tomorrow. Avoid unnecessary travel, stay away from low-lying areas, and be cautious of flooding.`,
        severity: maxPrecipitation >= 100 ? 'Critical' : maxPrecipitation >= 75 ? 'High' : 'Medium',
        type: 'Rainfall',
        location: locationName,
        issuedBy: 'India Meteorological Department (IMD) via Open-Meteo',
        validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
        timestamp: new Date().toISOString(),
        source: 'OpenMeteo',
        precipitation: maxPrecipitation,
      });
    }
    
    // 4. Wind Speed Alerts
    const maxWindSpeed = Math.max(...daily.windspeed_10m_max.slice(0, 3)); // Check next 3 days
    
    // Strong wind alert (> 50 km/h)
    if (maxWindSpeed >= 50) {
      alerts.push({
        id: `weather-${Date.now()}-wind`,
        title: 'Strong Wind Warning',
        description: `Strong winds expected: up to ${maxWindSpeed.toFixed(1)} km/h. Secure loose objects, avoid outdoor activities, and be cautious while driving.`,
        severity: maxWindSpeed >= 70 ? 'High' : 'Medium',
        type: 'Wind',
        location: locationName,
        issuedBy: 'India Meteorological Department (IMD) via Open-Meteo',
        validUntil: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
        timestamp: new Date().toISOString(),
        source: 'OpenMeteo',
        windSpeed: maxWindSpeed,
      });
    }
    
    // 5. Severe Weather Forecast (next 2-3 days)
    for (let i = 1; i < Math.min(3, daily.time.length); i++) {
      const weatherCode = daily.weathercode[i];
      const weatherInfo = weatherCodeMap[weatherCode] || { description: 'Unknown', severity: 'Low' };
      
      if (weatherInfo.severity === 'Critical') {
        alerts.push({
          id: `weather-${Date.now()}-forecast-${i}`,
          title: `Severe Weather Forecast - ${formatDate(daily.time[i])}`,
          description: `Severe weather conditions expected on ${formatDate(daily.time[i])}: ${weatherInfo.description}. Prepare accordingly and stay updated with latest forecasts.`,
          severity: 'High',
          type: getWeatherType(weatherCode),
          location: locationName,
          issuedBy: 'India Meteorological Department (IMD) via Open-Meteo',
          validUntil: new Date(daily.time[i]).toISOString(),
          timestamp: new Date().toISOString(),
          source: 'OpenMeteo',
        });
      }
    }
    
  } catch (error) {
    console.error('Error fetching weather from Open-Meteo:', error);
    // Return fallback alerts if API fails
    return getFallbackAlerts(lat, lon);
  }
  
  return alerts;
}

// Helper function to get weather type from code
function getWeatherType(code: number): string {
  if (code >= 51 && code <= 67) return 'Rainfall';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rainfall';
  if (code >= 85 && code <= 86) return 'Snow';
  if (code >= 95 && code <= 99) return 'Thunderstorm';
  return 'Weather';
}

// Helper function to format date
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-IN', { weekday: 'long', month: 'long', day: 'numeric' });
}

// Get location name from coordinates (using Open-Meteo Geocoding API)
async function getLocationName(lat: string, lon: string): Promise<string> {
  try {
    const response = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=&latitude=${lat}&longitude=${lon}&count=1&language=en&format=json`
    );
    const data = await response.json();
    if (data.results && data.results.length > 0) {
      return `${data.results[0].name}, ${data.results[0].admin1 || ''}`;
    }
  } catch (error) {
    console.error('Error fetching location name:', error);
  }
  return `Lat: ${lat}, Lon: ${lon}`;
}

// Fallback alerts if API fails
function getFallbackAlerts(lat: string, lon: string): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  const month = new Date().getMonth();
  const isMonsoon = month >= 6 && month <= 9;
  
  if (isMonsoon) {
    alerts.push({
      id: `weather-fallback-${Date.now()}`,
      title: 'Monsoon Season Advisory',
      description: 'Monsoon season is active. Stay updated with local weather forecasts and be prepared for heavy rainfall.',
      severity: 'Medium',
      type: 'Rainfall',
      location: 'Multiple regions',
      issuedBy: 'India Meteorological Department (IMD)',
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      timestamp: new Date().toISOString(),
      source: 'IMD',
    });
  }
  
  return alerts;
}
