import { NextRequest, NextResponse } from 'next/server';

// NDMA Alert types
interface NDMAAlert {
  id: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  category: string;
  affectedStates: string[];
  issuedBy: string;
  issuedDate: string;
  validUntil?: string;
  link?: string;
  source: 'NDMA';
}

export async function GET(request: NextRequest) {
  try {
    const alerts = await fetchNDMAAlerts();
    
    return NextResponse.json({
      success: true,
      alerts: alerts,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error fetching NDMA alerts:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch NDMA alerts',
      },
      { status: 500 }
    );
  }
}

async function fetchNDMAAlerts(): Promise<NDMAAlert[]> {
  const alerts: NDMAAlert[] = [];
  
  try {
    // In production, integrate with:
    // 1. NDMA official API (if available)
    // 2. NDMA RSS feeds
    // 3. Web scraping (with proper permissions and rate limiting)
    // 4. Government data portals
    
    // For now, return sample alerts that would be fetched from NDMA
    // Replace this with actual API calls in production
    
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
    
    // In production, you would:
    // 1. Fetch from NDMA RSS feed: https://ndma.gov.in/en/rss.xml
    // 2. Parse XML/RSS data
    // 3. Convert to structured format
    // 4. Store in database for caching
    
  } catch (error) {
    console.error('Error in fetchNDMAAlerts:', error);
  }
  
  return alerts;
}

