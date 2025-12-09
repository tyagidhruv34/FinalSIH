"use client";

import { useEffect, useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Landmark, CloudRain, AlertTriangle, RefreshCw, ExternalLink, MapPin, Calendar, Building2, Search, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { AdvisoryService, type WeatherAlert, type NDMAAlert } from "@/lib/firebase/advisories";
import { formatDistanceToNow, format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

const severityColors = {
  Critical: 'bg-red-500/10 text-red-600 border-red-500/20',
  High: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  Medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  Low: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

interface CityOption {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
  country_code: string;
}

export default function AdvisoriesPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);
  const [ndmaAlerts, setNDMAAlerts] = useState<NDMAAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  
  // Location selection state
  const [selectedCity, setSelectedCity] = useState<CityOption | null>(null);
  const [citySearch, setCitySearch] = useState('');
  const [citySearchResults, setCitySearchResults] = useState<CityOption[]>([]);
  const [searchingCities, setSearchingCities] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState('IN'); // Default to India
  const [fetchingWeather, setFetchingWeather] = useState(false);
  
  // Popular Indian cities for quick selection
  const popularIndianCities: CityOption[] = [
    { id: 1, name: 'Delhi', latitude: 28.6139, longitude: 77.2090, country: 'India', admin1: 'Delhi', country_code: 'IN' },
    { id: 2, name: 'Mumbai', latitude: 19.0760, longitude: 72.8777, country: 'India', admin1: 'Maharashtra', country_code: 'IN' },
    { id: 3, name: 'Bangalore', latitude: 12.9716, longitude: 77.5946, country: 'India', admin1: 'Karnataka', country_code: 'IN' },
    { id: 4, name: 'Kolkata', latitude: 22.5726, longitude: 88.3639, country: 'India', admin1: 'West Bengal', country_code: 'IN' },
    { id: 5, name: 'Chennai', latitude: 13.0827, longitude: 80.2707, country: 'India', admin1: 'Tamil Nadu', country_code: 'IN' },
    { id: 6, name: 'Hyderabad', latitude: 17.3850, longitude: 78.4867, country: 'India', admin1: 'Telangana', country_code: 'IN' },
    { id: 7, name: 'Pune', latitude: 18.5204, longitude: 73.8567, country: 'India', admin1: 'Maharashtra', country_code: 'IN' },
    { id: 8, name: 'Ahmedabad', latitude: 23.0225, longitude: 72.5714, country: 'India', admin1: 'Gujarat', country_code: 'IN' },
  ];
  
  // Default to Delhi on load
  useEffect(() => {
    if (!selectedCity) {
      setSelectedCity(popularIndianCities[0]); // Delhi
    }
  }, []);

  // Fetch weather when city changes
  useEffect(() => {
    if (selectedCity && user) {
      fetchWeatherForLocation(selectedCity);
    }
  }, [selectedCity?.id, user]); // Only when city ID changes or user changes

  // Search for cities (memoized to avoid infinite loops)
  const searchCities = useCallback(async (query: string, country: string) => {
    if (query.length < 2) {
      setCitySearchResults([]);
      return;
    }
    
    try {
      setSearchingCities(true);
      const response = await fetch(`/api/search-cities?q=${encodeURIComponent(query)}&country=${country}`);
      const data = await response.json();
      
      if (data.success) {
        setCitySearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Error searching cities:', error);
      setCitySearchResults([]);
    } finally {
      setSearchingCities(false);
    }
  }, []);

  // Fetch weather alerts for selected location (live data) - memoized
  const fetchWeatherForLocation = useCallback(async (city: CityOption | null) => {
    if (!city) return;
    
    try {
      setFetchingWeather(true);
      // Add timestamp to prevent caching and get live data
      const response = await fetch(
        `/api/weather-alerts?lat=${city.latitude}&lon=${city.longitude}&city=${encodeURIComponent(city.name)}&country=${encodeURIComponent(city.country)}&t=${Date.now()}`,
        {
          cache: 'no-store', // Always fetch fresh data
        }
      );
      const data = await response.json();
      
      if (data.success) {
        setWeatherAlerts(data.alerts || []);
        setLastSync(new Date());
        toast({
          title: "Live Weather Data Fetched",
          description: `Real-time weather alerts for ${city.name}, ${city.country}`,
        });
      } else {
        throw new Error(data.error || 'Failed to fetch weather data');
      }
    } catch (error) {
      console.error('Error fetching weather:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch live weather data. Please try again.",
      });
    } finally {
      setFetchingWeather(false);
    }
  }, [toast]);

  // Fetch alerts from Firestore (for NDMA only, weather comes from API)
  const fetchAlerts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      // Fetch NDMA alerts from Firestore
      const ndma = await AdvisoryService.getNDMAAlerts(20).catch(err => {
        console.error('Error fetching NDMA alerts:', err);
        return [];
      });
      setNDMAAlerts(ndma || []);
      
      // Fetch weather for selected city (or default)
      if (selectedCity) {
        await fetchWeatherForLocation(selectedCity);
      }
    } catch (error: any) {
      console.error('Error fetching advisories:', error);
      setNDMAAlerts([]);
    } finally {
      setLoading(false);
    }
  };

  // Sync alerts from API to Firestore
  const syncAlerts = async () => {
    try {
      setSyncing(true);
      const response = await fetch('/api/sync-advisories', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        // Refresh alerts after sync
        await fetchAlerts();
      }
    } catch (error) {
      console.error('Error syncing advisories:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Debounce city search
  useEffect(() => {
    if (citySearch.length < 2) {
      setCitySearchResults([]);
      return;
    }
    
    const timeoutId = setTimeout(() => {
      searchCities(citySearch, selectedCountry);
    }, 500); // Wait 500ms after user stops typing
    
    return () => clearTimeout(timeoutId);
  }, [citySearch, selectedCountry, searchCities]);

  useEffect(() => {
    // Only fetch if user is authenticated
    if (user) {
      fetchAlerts();
      // Auto-refresh weather every 2 minutes for live data
      const weatherRefreshInterval = setInterval(() => {
        if (selectedCity) {
          fetchWeatherForLocation(selectedCity);
        }
      }, 2 * 60 * 1000); // 2 minutes for real-time updates
      
      // Auto-sync NDMA alerts every 30 minutes
      const syncInterval = setInterval(() => {
        syncAlerts();
      }, 30 * 60 * 1000);

      return () => {
        clearInterval(weatherRefreshInterval);
        clearInterval(syncInterval);
      };
    } else {
      setLoading(false);
    }
  }, [user, selectedCity, fetchWeatherForLocation]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-[#FF9933] via-[#138808] to-[#FF9933] bg-clip-text text-transparent">
            Government Advisories
          </h1>
          <p className="text-muted-foreground text-sm">
            Real-time weather alerts and official NDMA advisories
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={syncAlerts}
            disabled={syncing}
            className="shadow-md hover:shadow-lg"
          >
            <RefreshCw className={cn("mr-2 h-4 w-4", syncing && "animate-spin")} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </Button>
        </div>
      </div>

      {lastSync && (
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-100 dark:bg-green-900/20 border border-green-300 dark:border-green-800">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-green-700 dark:text-green-400 font-medium">
              Live Data
            </span>
          </div>
          <span className="text-muted-foreground">
            Last updated: {formatDistanceToNow(lastSync, { addSuffix: true })}
          </span>
        </div>
      )}

      {/* Weather Alerts Section */}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#4A86E8] to-[#4A86E8]/80 flex items-center justify-center">
              <CloudRain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Weather Alerts</h2>
              <p className="text-sm text-muted-foreground">Real-time weather warnings from Open-Meteo</p>
            </div>
          </div>
        </div>

        {/* Location Selector */}
        <Card className="border-2 shadow-lg">
            <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-[#FF9933]" />
              Select Location
            </CardTitle>
            <CardDescription>Choose a city to view weather alerts</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              {/* Country Selection */}
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                  <SelectTrigger id="country" className="text-sm">
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">India</SelectItem>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="CA">Canada</SelectItem>
                    <SelectItem value="AU">Australia</SelectItem>
                    <SelectItem value="DE">Germany</SelectItem>
                    <SelectItem value="FR">France</SelectItem>
                    <SelectItem value="JP">Japan</SelectItem>
                    <SelectItem value="CN">China</SelectItem>
                    <SelectItem value="BR">Brazil</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Quick City Selection */}
              <div className="space-y-2">
                <Label>Quick Select (Popular Cities)</Label>
                <Select
                  value={selectedCity?.id.toString() || ''}
                  onValueChange={(value) => {
                    const city = popularIndianCities.find(c => c.id.toString() === value);
                    if (city) setSelectedCity(city);
                  }}
                >
                  <SelectTrigger className="text-sm">
                    <SelectValue placeholder="Select a city" />
                  </SelectTrigger>
                  <SelectContent>
                    {popularIndianCities.map((city) => (
                      <SelectItem key={city.id} value={city.id.toString()}>
                        {city.name}, {city.admin1}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* City Search */}
            <div className="space-y-2">
              <Label htmlFor="city-search">Or Search for City</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="city-search"
                  placeholder="Type city name (e.g., New York, London, Tokyo)..."
                  value={citySearch}
                  onChange={(e) => {
                    setCitySearch(e.target.value);
                  }}
                  className="pl-10 text-sm"
                />
                {searchingCities && (
                  <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
                )}
              </div>
              
              {/* Search Results */}
              {citySearchResults.length > 0 && citySearch && (
                <div className="border rounded-lg bg-background shadow-md max-h-60 overflow-y-auto">
                  {citySearchResults.map((city) => (
                    <button
                      key={city.id}
                      onClick={() => {
                        setSelectedCity(city);
                        setCitySearch('');
                        setCitySearchResults([]);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b last:border-b-0"
                    >
                      <div className="font-semibold text-sm">{city.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {city.admin1 && `${city.admin1}, `}{city.country}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Location Display */}
            {selectedCity && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-[#FF9933]/10 to-[#138808]/10 border border-[#FF9933]/20">
                <div className="flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-[#FF9933]" />
                  <div>
                    <p className="font-semibold text-sm">{selectedCity.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedCity.admin1 && `${selectedCity.admin1}, `}{selectedCity.country}
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => fetchWeatherForLocation(selectedCity)}
                  disabled={fetchingWeather}
                  className="bg-gradient-to-r from-[#FF9933] to-[#FF9933]/90 hover:from-[#FF9933]/90 hover:to-[#FF9933]"
                >
                  {fetchingWeather ? (
                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Fetching...</>
                  ) : (
                    <><RefreshCw className="mr-2 h-4 w-4" /> Refresh Weather</>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : weatherAlerts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <CloudRain className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No weather alerts at this time</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {weatherAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={cn(
                  "card-hover border-l-4 animate-fade-in",
                  severityColors[alert.severity].split(' ')[0].replace('bg-', 'border-l-')
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base font-bold">{alert.title}</CardTitle>
                        <Badge className={cn("shrink-0", severityColors[alert.severity])}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {alert.issuedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {alert.location}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#4A86E8] to-[#4A86E8]/80 flex items-center justify-center shrink-0">
                      <CloudRain className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground/90 leading-relaxed">{alert.description}</p>
                  
                  {/* Weather Data Display */}
                  {(alert.temperature !== undefined || alert.precipitation !== undefined || alert.windSpeed !== undefined) && (
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
                      {alert.temperature !== undefined && (
                        <div className="text-center p-2 rounded-md bg-muted/50">
                          <p className="text-xs text-muted-foreground">Temperature</p>
                          <p className="text-sm font-semibold">{alert.temperature.toFixed(1)}°C</p>
                        </div>
                      )}
                      {alert.precipitation !== undefined && (
                        <div className="text-center p-2 rounded-md bg-muted/50">
                          <p className="text-xs text-muted-foreground">Precipitation</p>
                          <p className="text-sm font-semibold">{alert.precipitation.toFixed(1)}mm</p>
                        </div>
                      )}
                      {alert.windSpeed !== undefined && (
                        <div className="text-center p-2 rounded-md bg-muted/50">
                          <p className="text-xs text-muted-foreground">Wind Speed</p>
                          <p className="text-sm font-semibold">{alert.windSpeed.toFixed(1)} km/h</p>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between pt-2 border-t text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(alert.timestamp), 'MMM dd, yyyy HH:mm')}
                    </span>
                    {alert.validUntil && (
                      <span>Valid until: {format(new Date(alert.validUntil), 'MMM dd')}</span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* NDMA Alerts Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-[#FF9933] to-[#FF9933]/80 flex items-center justify-center">
            <Landmark className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">NDMA Advisories</h2>
            <p className="text-sm text-muted-foreground">Official advisories from National Disaster Management Authority</p>
          </div>
        </div>

        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
                  <Skeleton className="h-20 w-full" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : ndmaAlerts.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <Landmark className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No NDMA advisories at this time</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {ndmaAlerts.map((alert) => (
              <Card
                key={alert.id}
                className={cn(
                  "card-hover border-l-4 animate-fade-in",
                  severityColors[alert.severity].split(' ')[0].replace('bg-', 'border-l-')
                )}
              >
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base font-bold">{alert.title}</CardTitle>
                        <Badge className={cn("shrink-0", severityColors[alert.severity])}>
                          {alert.severity}
                        </Badge>
                      </div>
                      <CardDescription className="flex items-center gap-4 text-sm flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" />
                          {alert.issuedBy}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(alert.issuedDate), 'MMM dd, yyyy')}
                        </span>
                      </CardDescription>
                    </div>
                    <div className="h-12 w-12 rounded-lg bg-gradient-to-br from-[#FF9933] to-[#FF9933]/80 flex items-center justify-center shrink-0">
                      <Landmark className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-foreground/90 leading-relaxed">{alert.description}</p>
                  {alert.affectedStates && alert.affectedStates.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                        Affected States:
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {alert.affectedStates.map((state) => (
                          <Badge key={state} variant="secondary" className="text-xs">
                            {state}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t">
                    {alert.link && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={alert.link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="mr-2 h-3 w-3" />
                          View on NDMA
                        </a>
                      </Button>
                    )}
                    {alert.validUntil && (
                      <span className="text-xs text-muted-foreground">
                        Valid until: {format(new Date(alert.validUntil), 'MMM dd, yyyy')}
                      </span>
                    )}
                  </div>
            </CardContent>
          </Card>
        ))}
          </div>
        )}
      </div>
    </div>
  );
}
    