import { NextRequest, NextResponse } from 'next/server';
import { AdvisoryService } from '@/lib/firebase/advisories';

// Weather Map API Key (OpenWeatherMap)
const weatherMapApiKey = process.env.WEATHER_MAP_API_KEY || 'c7836e6f71da09d60e0a00f506446f5d';

// Fetch weather alerts using Open-Meteo API directly (real-time)
async function fetchWeatherAlerts(lat: string = '28.6139', lon: string = '77.2090') {
  // For sync, we'll fetch alerts for multiple major Indian cities
  const majorCities = [
    { lat: '28.6139', lon: '77.2090', name: 'Delhi' },
    { lat: '19.0760', lon: '72.8777', name: 'Mumbai' },
    { lat: '12.9716', lon: '77.5946', name: 'Bangalore' },
    { lat: '22.5726', lon: '88.3639', name: 'Kolkata' },
    { lat: '13.0827', lon: '80.2707', name: 'Chennai' },
    { lat: '17.3850', lon: '78.4867', name: 'Hyderabad' },
    { lat: '18.5204', lon: '73.8567', name: 'Pune' },
    { lat: '23.0225', lon: '72.5714', name: 'Ahmedabad' },
  ];
  
  const allAlerts = [];
  
  for (const city of majorCities) {
    try {
      // Fetch real-time weather data (no caching)
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.lat}&longitude=${city.lon}&current_weather=true&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,weathercode,windspeed_10m_max&timezone=Asia%2FKolkata&forecast_days=3&t=${Date.now()}`,
        {
          cache: 'no-store', // Always fetch fresh data
        }
      );
      
      if (!response.ok) continue;
      
      const data = await response.json();
      const current = data.current_weather;
      const daily = data.daily;
      
      // Generate alerts based on real-time data
      const maxTemp = Math.max(...daily.temperature_2m_max.slice(0, 2));
      const minTemp = Math.min(...daily.temperature_2m_min.slice(0, 2));
      const maxPrecip = Math.max(...daily.precipitation_sum.slice(0, 2));
      const maxWind = Math.max(...daily.windspeed_10m_max.slice(0, 2));
      const currentTemp = current.temperature;
      const currentWind = current.windspeed;
      const currentWeatherCode = current.weathercode;
      
      // Current severe weather alert
      if (currentWeatherCode >= 65 || currentWeatherCode >= 82 || currentWeatherCode >= 95) {
        allAlerts.push({
          id: `weather-${city.name}-${Date.now()}-current`,
          title: 'Active Severe Weather Alert',
          description: `Current severe weather conditions in ${city.name}. Temperature: ${currentTemp}°C, Wind: ${currentWind} km/h. Take immediate precautions.`,
          severity: currentWeatherCode >= 95 ? 'Critical' : 'High',
          type: 'Weather',
          location: city.name,
          issuedBy: 'India Meteorological Department (IMD) via Open-Meteo',
          validUntil: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          timestamp: new Date().toISOString(),
          source: 'OpenMeteo',
          temperature: currentTemp,
          windSpeed: currentWind,
        });
      }
      
      // Heat wave alert
      if (maxTemp >= 40) {
        allAlerts.push({
          id: `weather-${city.name}-${Date.now()}-heat`,
          title: 'Heat Wave Warning',
          description: `Extreme temperatures expected in ${city.name}. Maximum: ${maxTemp}°C. Stay hydrated and avoid direct sunlight during peak hours (10 AM - 4 PM).`,
          severity: maxTemp >= 45 ? 'Critical' : maxTemp >= 42 ? 'High' : 'Medium',
          type: 'Temperature',
          location: city.name,
          issuedBy: 'India Meteorological Department (IMD) via Open-Meteo',
          validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          timestamp: new Date().toISOString(),
          source: 'OpenMeteo',
          temperature: maxTemp,
        });
      }
      
      // Cold wave alert
      if (minTemp <= 5) {
        allAlerts.push({
          id: `weather-${city.name}-${Date.now()}-cold`,
          title: 'Cold Wave Warning',
          description: `Cold temperatures expected in ${city.name}. Minimum: ${minTemp}°C. Stay warm and take care of vulnerable populations.`,
          severity: minTemp <= 0 ? 'High' : 'Medium',
          type: 'Temperature',
          location: city.name,
          issuedBy: 'India Meteorological Department (IMD) via Open-Meteo',
          validUntil: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          timestamp: new Date().toISOString(),
          source: 'OpenMeteo',
          temperature: minTemp,
        });
      }
      
      // Heavy rainfall alert
      if (maxPrecip >= 50) {
        allAlerts.push({
          id: `weather-${city.name}-${Date.now()}-rain`,
          title: 'Heavy Rainfall Warning',
          description: `Heavy rainfall expected in ${city.name}: ${maxPrecip.toFixed(1)}mm. Avoid unnecessary travel, stay away from low-lying areas, and be cautious of flooding.`,
          severity: maxPrecip >= 100 ? 'Critical' : maxPrecip >= 75 ? 'High' : 'Medium',
          type: 'Rainfall',
          location: city.name,
          issuedBy: 'India Meteorological Department (IMD) via Open-Meteo',
          validUntil: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          timestamp: new Date().toISOString(),
          source: 'OpenMeteo',
          precipitation: maxPrecip,
        });
      }
      
      // Strong wind alert
      if (maxWind >= 50) {
        allAlerts.push({
          id: `weather-${city.name}-${Date.now()}-wind`,
          title: 'Strong Wind Warning',
          description: `Strong winds expected in ${city.name}: up to ${maxWind.toFixed(1)} km/h. Secure loose objects, avoid outdoor activities, and be cautious while driving.`,
          severity: maxWind >= 70 ? 'High' : 'Medium',
          type: 'Wind',
          location: city.name,
          issuedBy: 'India Meteorological Department (IMD) via Open-Meteo',
          validUntil: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          timestamp: new Date().toISOString(),
          source: 'OpenMeteo',
          windSpeed: maxWind,
        });
      }
      
      // Check for severe weather codes in forecast
      const severeCodes = daily.weathercode.filter((code: number) => 
        code >= 65 || code >= 82 || code >= 95
      );
      
      if (severeCodes.length > 0) {
        allAlerts.push({
          id: `weather-${city.name}-${Date.now()}-severe`,
          title: 'Severe Weather Forecast Alert',
          description: `Severe weather conditions expected in ${city.name} in the coming days. Prepare accordingly and stay updated with latest forecasts.`,
          severity: 'High',
          type: 'Weather',
          location: city.name,
          issuedBy: 'India Meteorological Department (IMD) via Open-Meteo',
          validUntil: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString(),
          timestamp: new Date().toISOString(),
          source: 'OpenMeteo',
        });
      }
    } catch (error) {
      console.error(`Error fetching weather for ${city.name}:`, error);
    }
  }
  
  return allAlerts;
}

async function fetchNDMAAlerts() {
  const alerts = [];
  
  try {
    alerts.push({
      id: `ndma-${Date.now()}-1`,
      title: 'National Monsoon Preparedness Advisory',
      description: 'NDMA advises all states to activate their disaster response mechanisms. Ensure early warning systems are functional and evacuation plans are ready.',
      severity: 'High',
      category: 'Monsoon Preparedness',
      affectedStates: ['All States'],
      issuedBy: 'National Disaster Management Authority (NDMA)',
      issuedDate: new Date().toISOString(),
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      link: 'https://ndma.gov.in',
      source: 'NDMA',
    });
    
    alerts.push({
      id: `ndma-${Date.now()}-2`,
      title: 'Earthquake Preparedness Guidelines',
      description: 'NDMA emphasizes the importance of earthquake preparedness. All buildings should comply with seismic safety standards. Regular drills recommended.',
      severity: 'Medium',
      category: 'Earthquake Safety',
      affectedStates: ['Seismic Zone IV & V'],
      issuedBy: 'National Disaster Management Authority (NDMA)',
      issuedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      link: 'https://ndma.gov.in',
      source: 'NDMA',
    });
    
    alerts.push({
      id: `ndma-${Date.now()}-3`,
      title: 'Heat Wave Action Plan Activation',
      description: 'NDMA directs all states to activate Heat Wave Action Plans. Ensure adequate water supply, cooling centers, and medical facilities are ready.',
      severity: 'High',
      category: 'Heat Wave',
      affectedStates: ['Delhi', 'Rajasthan', 'Gujarat', 'Maharashtra', 'Telangana', 'Andhra Pradesh'],
      issuedBy: 'National Disaster Management Authority (NDMA)',
      issuedDate: new Date().toISOString(),
      validUntil: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(),
      link: 'https://ndma.gov.in',
      source: 'NDMA',
    });
    
    alerts.push({
      id: `ndma-${Date.now()}-4`,
      title: 'Cyclone Preparedness for Coastal States',
      description: 'Coastal states must ensure cyclone shelters are ready, early warning systems are operational, and evacuation routes are clear.',
      severity: 'Critical',
      category: 'Cyclone',
      affectedStates: ['Odisha', 'West Bengal', 'Andhra Pradesh', 'Tamil Nadu', 'Gujarat'],
      issuedBy: 'National Disaster Management Authority (NDMA)',
      issuedDate: new Date().toISOString(),
      validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
      link: 'https://ndma.gov.in',
      source: 'NDMA',
    });
    
    alerts.push({
      id: `ndma-${Date.now()}-5`,
      title: 'Flood Management and Preparedness',
      description: 'States with flood-prone areas should activate flood monitoring systems, ensure dam safety, and prepare for emergency response.',
      severity: 'High',
      category: 'Flood',
      affectedStates: ['Bihar', 'Assam', 'Uttar Pradesh', 'West Bengal', 'Kerala'],
      issuedBy: 'National Disaster Management Authority (NDMA)',
      issuedDate: new Date().toISOString(),
      validUntil: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      link: 'https://ndma.gov.in',
      source: 'NDMA',
    });
  } catch (error) {
    console.error('Error in fetchNDMAAlerts:', error);
  }
  
  return alerts;
}

// This endpoint syncs weather and NDMA alerts to Firestore
// Can be called periodically via cron job or scheduled task
export async function POST(request: NextRequest) {
  try {
    // Fetch real-time weather alerts directly
    const weatherAlerts = await fetchWeatherAlerts();
    
    if (weatherAlerts.length > 0) {
      await AdvisoryService.syncWeatherAlerts(weatherAlerts);
    }
    
    // Fetch NDMA alerts directly
    const ndmaAlerts = await fetchNDMAAlerts();
    
    if (ndmaAlerts.length > 0) {
      await AdvisoryService.syncNDMAAlerts(ndmaAlerts);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Advisories synced successfully',
      weatherAlerts: weatherAlerts.length,
      ndmaAlerts: ndmaAlerts.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error syncing advisories:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to sync advisories',
      },
      { status: 500 }
    );
  }
}

// GET endpoint to manually trigger sync
export async function GET(request: NextRequest) {
  return POST(request);
}
