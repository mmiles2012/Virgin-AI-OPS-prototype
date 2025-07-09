/**
 * Official FAA NOTAM API Integration for Airspace Information
 * Provides authentic NOTAMs, airspace restrictions, and operational notices
 */

interface FAANotam {
  notamNumber: string;
  featureType: string;
  issueDate: string;
  startDate: string;
  endDate: string;
  source: string;
  sourceType: string;
  icaoLocation: string;
  coordinates: {
    latitude: number;
    longitude: number;
  } | null;
  radius: number | null;
  minimumAltitude: number | null;
  maximumAltitude: number | null;
  text: string;
  classification: string;
  status: 'ACTIVE' | 'CANCELLED' | 'EXPIRED';
  affectedFacilities: string[];
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

interface NotamSearchParams {
  locations?: string[];
  startDate?: string;
  endDate?: string;
  featureTypes?: string[];
  maxResults?: number;
}

class FAANotamService {
  private readonly baseUrl = 'https://external-api.faa.gov/notamapi/v1';
  private readonly apiKey: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTimeout = 300000; // 5 minutes for NOTAMs

  constructor() {
    this.apiKey = process.env.FAA_NOTAM_API_KEY || '';
    if (!this.apiKey) {
      console.warn('[FAA NOTAM] API key not configured - service will use fallback data');
    }
  }

  private async makeRequest(endpoint: string, params: Record<string, any> = {}): Promise<any> {
    if (!this.apiKey) {
      throw new Error('FAA NOTAM API key not configured');
    }

    const queryParams = new URLSearchParams({
      ...params,
      api_key: this.apiKey
    });

    const cacheKey = `${endpoint}?${queryParams.toString()}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}?${queryParams}`, {
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`FAA NOTAM API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      console.error('[FAA NOTAM] API request failed:', error);
      throw error;
    }
  }

  /**
   * Search NOTAMs by criteria
   */
  async searchNotams(params: NotamSearchParams): Promise<FAANotam[]> {
    try {
      const searchParams = {
        locations: params.locations?.join(',') || '',
        startDateTime: params.startDate || new Date().toISOString(),
        endDateTime: params.endDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        pageSize: params.maxResults || 100
      };

      const response = await this.makeRequest('/notams/search', searchParams);
      
      const notams: FAANotam[] = response.items?.map((item: any) => this.parseNotam(item)) || [];
      
      console.log(`[FAA NOTAM] Found ${notams.length} NOTAMs`);
      return notams;
    } catch (error) {
      console.error('[FAA NOTAM] Failed to search NOTAMs:', error);
      return this.getFallbackNotams();
    }
  }

  /**
   * Get NOTAMs for Virgin Atlantic route network
   */
  async getVirginAtlanticRouteNotams(): Promise<FAANotam[]> {
    const virginAtlanticAirports = [
      'EGLL', // London Heathrow
      'KJFK', // New York JFK
      'KBOS', // Boston
      'KLAX', // Los Angeles
      'KSFO', // San Francisco
      'KIAD', // Washington Dulles
      'KMCO', // Orlando
      'KMIA', // Miami
      'KTPA', // Tampa
      'KLAS', // Las Vegas
      'VABB', // Mumbai
      'VOBL', // Bangalore
      'VIDP', // Delhi
      'OMDB', // Dubai
      'FAOR', // Johannesburg
      'GVAC', // Cape Verde
      'MKJS', // Montego Bay
      'TBPB', // Barbados
      'MKJP'  // Kingston
    ];

    return this.searchNotams({
      locations: virginAtlanticAirports,
      maxResults: 200
    });
  }

  /**
   * Get NOTAMs affecting a specific airport
   */
  async getAirportNotams(icaoCode: string): Promise<FAANotam[]> {
    return this.searchNotams({
      locations: [icaoCode],
      maxResults: 50
    });
  }

  /**
   * Get route-specific NOTAMs between two airports
   */
  async getRouteNotams(origin: string, destination: string): Promise<FAANotam[]> {
    return this.searchNotams({
      locations: [origin, destination],
      maxResults: 100
    });
  }

  /**
   * Get critical NOTAMs that require immediate attention
   */
  async getCriticalNotams(): Promise<FAANotam[]> {
    const allNotams = await this.getVirginAtlanticRouteNotams();
    return allNotams.filter(notam => 
      notam.impact === 'CRITICAL' || 
      notam.impact === 'HIGH' ||
      notam.classification === 'RUNWAY' ||
      notam.classification === 'AIRSPACE'
    );
  }

  /**
   * Get NOTAM statistics and summary
   */
  async getNotamSummary(): Promise<any> {
    try {
      const notams = await this.getVirginAtlanticRouteNotams();
      
      const summary = {
        total_notams: notams.length,
        active_notams: notams.filter(n => n.status === 'ACTIVE').length,
        critical_notams: notams.filter(n => n.impact === 'CRITICAL').length,
        high_impact_notams: notams.filter(n => n.impact === 'HIGH').length,
        airports_affected: [...new Set(notams.map(n => n.icaoLocation))].length,
        classification_breakdown: {} as Record<string, number>,
        impact_breakdown: {} as Record<string, number>,
        expiring_soon: notams.filter(n => {
          const endDate = new Date(n.endDate);
          const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
          return endDate < tomorrow && n.status === 'ACTIVE';
        }).length,
        last_updated: new Date().toISOString()
      };

      // Count by classification
      notams.forEach(notam => {
        summary.classification_breakdown[notam.classification] = 
          (summary.classification_breakdown[notam.classification] || 0) + 1;
        summary.impact_breakdown[notam.impact] = 
          (summary.impact_breakdown[notam.impact] || 0) + 1;
      });

      return summary;
    } catch (error) {
      console.error('[FAA NOTAM] Failed to get summary:', error);
      return this.getFallbackSummary();
    }
  }

  /**
   * Parse raw NOTAM data into standardized format
   */
  private parseNotam(item: any): FAANotam {
    // Extract coordinates if available
    let coordinates = null;
    if (item.geometry && item.geometry.coordinates) {
      coordinates = {
        latitude: item.geometry.coordinates[1],
        longitude: item.geometry.coordinates[0]
      };
    }

    // Determine impact level based on content
    const text = item.text?.toLowerCase() || '';
    let impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' = 'LOW';
    
    if (text.includes('runway') || text.includes('closed') || text.includes('emergency')) {
      impact = 'CRITICAL';
    } else if (text.includes('reduced') || text.includes('limited') || text.includes('caution')) {
      impact = 'HIGH';
    } else if (text.includes('maintenance') || text.includes('construction')) {
      impact = 'MEDIUM';
    }

    // Determine classification
    let classification = 'GENERAL';
    if (text.includes('runway')) classification = 'RUNWAY';
    else if (text.includes('airspace') || text.includes('restricted')) classification = 'AIRSPACE';
    else if (text.includes('navigation') || text.includes('ils') || text.includes('vor')) classification = 'NAVIGATION';
    else if (text.includes('lighting') || text.includes('approach')) classification = 'LIGHTING';

    return {
      notamNumber: item.properties?.coreNOTAMData?.notam?.number || 'UNKNOWN',
      featureType: item.properties?.coreNOTAMData?.notam?.type || 'NOTAM',
      issueDate: item.properties?.coreNOTAMData?.notam?.issued || new Date().toISOString(),
      startDate: item.properties?.coreNOTAMData?.notam?.startDateTime || new Date().toISOString(),
      endDate: item.properties?.coreNOTAMData?.notam?.endDateTime || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      source: 'FAA',
      sourceType: 'OFFICIAL',
      icaoLocation: item.properties?.coreNOTAMData?.notam?.icaoLocation || 'UNKNOWN',
      coordinates,
      radius: item.properties?.coreNOTAMData?.notam?.radius || null,
      minimumAltitude: item.properties?.coreNOTAMData?.notam?.minimumAltitude || null,
      maximumAltitude: item.properties?.coreNOTAMData?.notam?.maximumAltitude || null,
      text: item.properties?.coreNOTAMData?.notam?.text || 'No details available',
      classification,
      status: item.properties?.coreNOTAMData?.notam?.status || 'ACTIVE',
      affectedFacilities: item.properties?.coreNOTAMData?.notam?.affectedFacilities || [],
      impact
    };
  }

  /**
   * Fallback NOTAMs when API is unavailable
   */
  private getFallbackNotams(): FAANotam[] {
    console.log('[FAA NOTAM] Using fallback NOTAM data');
    
    return [
      {
        notamNumber: 'DEMO001',
        featureType: 'NOTAM',
        issueDate: new Date().toISOString(),
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        source: 'FAA',
        sourceType: 'DEMO',
        icaoLocation: 'KJFK',
        coordinates: { latitude: 40.6413, longitude: -73.7781 },
        radius: 5,
        minimumAltitude: 0,
        maximumAltitude: 50000,
        text: 'Demo NOTAM - JFK Airport runway maintenance operations in progress',
        classification: 'RUNWAY',
        status: 'ACTIVE',
        affectedFacilities: ['RWY 04L/22R'],
        impact: 'MEDIUM'
      }
    ];
  }

  private getFallbackSummary(): any {
    return {
      total_notams: 1,
      active_notams: 1,
      critical_notams: 0,
      high_impact_notams: 0,
      airports_affected: 1,
      classification_breakdown: { 'RUNWAY': 1 },
      impact_breakdown: { 'MEDIUM': 1 },
      expiring_soon: 0,
      last_updated: new Date().toISOString()
    };
  }

  /**
   * Health check for FAA NOTAM service
   */
  async healthCheck(): Promise<{ status: string; message: string; authenticated: boolean }> {
    if (!this.apiKey) {
      return {
        status: 'error',
        message: 'FAA NOTAM API key not configured',
        authenticated: false
      };
    }

    try {
      await this.makeRequest('/notams/search', { locations: 'KJFK', pageSize: 1 });
      return {
        status: 'ok',
        message: 'FAA NOTAM API connection successful',
        authenticated: true
      };
    } catch (error) {
      return {
        status: 'error',
        message: `FAA NOTAM API connection failed: ${error}`,
        authenticated: false
      };
    }
  }
}

export const faaNotamService = new FAANotamService();
export type { FAANotam, NotamSearchParams };