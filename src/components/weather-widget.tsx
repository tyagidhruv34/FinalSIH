'use client';

import { useEffect, useState } from 'react';
import { Cloud, CloudRain, Sun, Wind, Droplets, Eye, Gauge } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface WeatherData {
  temperature: number;
  weatherCode: number;
  windSpeed: number;
  humidity: number;
  visibility: string;
  pressure: number;
  precipitation: number;
  feelsLike: number;
}

interface City {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  admin1?: string;
}

const POPULAR_CITIES: City[] = [
  { id: 1, name: 'Delhi', latitude: 28.7041, longitude: 77.1025, admin1: 'Delhi' },
  { id: 2, name: 'Mumbai', latitude: 19.0760, longitude: 72.8777, admin1: 'Maharashtra' },
  { id: 3, name: 'Bangalore', latitude: 12.9716, longitude: 77.5946, admin1: 'Karnataka' },
  { id: 4, name: 'Kolkata', latitude: 22.5726, longitude: 88.3639, admin1: 'West Bengal' },
  { id: 5, name: 'Chennai', latitude: 13.0827, longitude: 80.2707, admin1: 'Tamil Nadu' },
  { id: 6, name: 'Hyderabad', latitude: 17.3850, longitude: 78.4867, admin1: 'Telangana' },
];

// WMO Weather Code to description mapping
const getWeatherDescription = (code: number): string => {
  if (code === 0) return 'Clear Sky';
  if (code === 1 || code === 2) return 'Mostly Clear';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Foggy';
  if (code === 51 || code === 53 || code === 55) return 'Drizzle';
  if (code === 61 || code === 63 || code === 65) return 'Rain';
  if (code === 71 || code === 73 || code === 75) return 'Snow';
  if (code === 77) return 'Snow Grains';
  if (code === 80 || code === 81 || code === 82) return 'Rain Showers';
  if (code === 85 || code === 86) return 'Snow Showers';
  if (code === 95 || code === 96 || code === 99) return 'Thunderstorm';
  return 'Unknown';
};

const getWeatherIcon = (code: number) => {
  if (code === 0) return <Sun className="h-12 w-12 text-yellow-400" />;
  if (code === 1 || code === 2) return <Cloud className="h-12 w-12 text-gray-400" />;
  if (code === 3) return <Cloud className="h-12 w-12 text-gray-500" />;
  if (code >= 45 && code <= 48) return <Cloud className="h-12 w-12 text-gray-600" />;
  if (code >= 51 && code <= 82) return <CloudRain className="h-12 w-12 text-blue-400" />;
  if (code >= 95) return <CloudRain className="h-12 w-12 text-purple-500" />;
  return <Cloud className="h-12 w-12 text-gray-400" />;
};

export default function WeatherWidget() {
  const [weather, setWeather] = useState<Map<number, WeatherData | null>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCityId, setSelectedCityId] = useState(1); // Default to Delhi

  const fetchWeather = async (city: City) => {
    try {
      const response = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${city.latitude}&longitude=${city.longitude}&current=temperature_2m,weather_code,wind_speed_10m,relative_humidity_2m,apparent_temperature,visibility,pressure_msl,precipitation&timezone=Asia/Kolkata`,
        { next: { revalidate: 600 } } // Revalidate every 10 minutes
      );

      if (!response.ok) throw new Error('Failed to fetch weather');

      const data = await response.json();
      const current = data.current;

      const weatherData: WeatherData = {
        temperature: Math.round(current.temperature_2m),
        weatherCode: current.weather_code,
        windSpeed: Math.round(current.wind_speed_10m),
        humidity: current.relative_humidity_2m,
        visibility: (current.visibility / 1000).toFixed(1),
        pressure: current.pressure_msl,
        precipitation: current.precipitation || 0,
        feelsLike: Math.round(current.apparent_temperature),
      };

      setWeather((prev) => new Map(prev).set(city.id, weatherData));
    } catch (err) {
      console.error(`Error fetching weather for ${city.name}:`, err);
      setWeather((prev) => new Map(prev).set(city.id, null));
      setError(`Failed to load weather for ${city.name}`);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Fetch weather for all popular cities
    Promise.all(POPULAR_CITIES.map((city) => fetchWeather(city))).finally(() => {
      setLoading(false);
    });

    // Set up auto-refresh every 10 minutes
    const interval = setInterval(() => {
      POPULAR_CITIES.forEach((city) => fetchWeather(city));
    }, 600000);

    return () => clearInterval(interval);
  }, []);

  const selectedCity = POPULAR_CITIES.find((c) => c.id === selectedCityId);
  const selectedWeather = weather.get(selectedCityId);

  return (
    <Card className="card-hover shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sun className="h-5 w-5 text-primary" />
          </div>
          <span>Weather Updates</span>
        </CardTitle>
        <CardDescription>Current weather conditions in major cities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* City Selector */}
        <div className="flex flex-wrap gap-2">
          {POPULAR_CITIES.map((city) => (
            <Button
              key={city.id}
              variant={selectedCityId === city.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedCityId(city.id)}
              className="text-xs"
            >
              {city.name}
            </Button>
          ))}
        </div>

        {/* Main Weather Display */}
        {loading && selectedWeather === undefined ? (
          <div className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : error && !selectedWeather ? (
          <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        ) : selectedWeather ? (
          <div className="space-y-4">
            {/* City Name and Main Temp */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{selectedCity?.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedCity?.admin1}
                </p>
              </div>
              <div className="text-right">
                <p className="text-4xl font-bold text-primary">
                  {selectedWeather.temperature}°C
                </p>
                <p className="text-sm text-muted-foreground">
                  Feels like {selectedWeather.feelsLike}°C
                </p>
              </div>
            </div>

            {/* Weather Icon and Description */}
            <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
              <div>{getWeatherIcon(selectedWeather.weatherCode)}</div>
              <div>
                <p className="font-semibold">
                  {getWeatherDescription(selectedWeather.weatherCode)}
                </p>
                {selectedWeather.precipitation > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Precipitation: {selectedWeather.precipitation} mm
                  </p>
                )}
              </div>
            </div>

            {/* Weather Details Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Wind className="h-4 w-4 text-primary" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Wind Speed
                  </span>
                </div>
                <p className="text-lg font-bold">{selectedWeather.windSpeed} km/h</p>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Droplets className="h-4 w-4 text-blue-500" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Humidity
                  </span>
                </div>
                <p className="text-lg font-bold">{selectedWeather.humidity}%</p>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="h-4 w-4 text-amber-500" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Visibility
                  </span>
                </div>
                <p className="text-lg font-bold">{selectedWeather.visibility} km</p>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-2 mb-1">
                  <Gauge className="h-4 w-4 text-purple-500" />
                  <span className="text-xs font-semibold text-muted-foreground uppercase">
                    Pressure
                  </span>
                </div>
                <p className="text-lg font-bold">{selectedWeather.pressure} hPa</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-lg bg-muted text-center">
            <p className="text-sm text-muted-foreground">No weather data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
