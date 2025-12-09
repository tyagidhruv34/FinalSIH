import { NextRequest, NextResponse } from 'next/server';

interface CityResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string; // State/Province
  country_code: string;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const query = searchParams.get('q') || '';
    const country = searchParams.get('country') || '';
    
    if (!query || query.length < 2) {
      return NextResponse.json({
        success: true,
        results: [],
      });
    }
    
    // Use Open-Meteo Geocoding API
    let url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=20&language=en&format=json`;
    
    if (country) {
      url += `&country=${encodeURIComponent(country)}`;
    }
    
    const response = await fetch(url, {
      next: { revalidate: 3600 } // Cache for 1 hour
    });
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    const results: CityResult[] = (data.results || []).map((result: any) => ({
      id: result.id,
      name: result.name,
      latitude: result.latitude,
      longitude: result.longitude,
      country: result.country,
      admin1: result.admin1,
      country_code: result.country_code,
    }));
    
    return NextResponse.json({
      success: true,
      results: results,
    });
  } catch (error: any) {
    console.error('Error searching cities:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to search cities',
        results: [],
      },
      { status: 500 }
    );
  }
}
