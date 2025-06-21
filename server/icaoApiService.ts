import axios from 'axios';

export interface ICAOFlightData {
  icao24: string;
  callsign: string;
  registration: string;
  aircraft_type: string;
  operator: string;
  origin: string;
  destination: string;
  position: {
    latitude: number;
    longitude: number;
    altitude_ft: number;
    heading: number;
  };
  speed: {
    ground_speed_kts: number;
    indicated_airspeed_kts: number;
    mach: number;
  };
  flight_phase: string;
  squawk: string;
  emergency: boolean;
  timestamp: string;
}

export interface ICAOAirportData {
  icao_code: string;
  iata_code: string;
  name: string;
  city: string;
  country: string;
  position: {
    latitude: number;
    longitude: number;
    elevation_ft: number;
  };
  runways: Array<{
    designation: string;
    length_ft: number;
    width_ft: number;
    surface: string;
    ils_available: boolean;
  }>;
  operational_status: string;
  timezone: string;
}

export interface ICAONotamData {
  notam_id: string;
  airport_icao: string;
  type: string;
  condition: string;
  location: string;
  effective_from: string;
  effective_until: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affects_operations: boolean;
}

class ICAOApiService {
  private baseUrl = 'https://api.icao.int/v1';
  private apiKey: string | undefined;
  private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();
  private callCount: number = 0;
  private callLimit: number = 100;
  private rateLimitReset: number = Date.now() + (24 * 60 * 60 * 1000); // 24 hours
  
  constructor() {
    this.apiKey = process.env.ICAO_API_KEY || '043b75c5-6a88-4b27-9b7f-148c6b2e5893';
    console.log('ICAO Aviation API Service initialized with call limit optimization');
    console.log(`Call limit: ${this.callLimit} calls per 24 hours`);
    
    if (!this.apiKey) {
      console.warn('ICAO API key not configured - some features may be limited');
    } else {
      console.log('ICAO API authenticated with rate limiting enabled');
    }
  }

  private canMakeCall(): boolean {
    if (Date.now() > this.rateLimitReset) {
      this.callCount = 0;
      this.rateLimitReset = Date.now() + (24 * 60 * 60 * 1000);
    }
    
    return this.callCount < this.callLimit;
  }

  private incrementCallCount(): void {
    this.callCount++;
    console.log(`ICAO API call ${this.callCount}/${this.callLimit} (${this.callLimit - this.callCount} remaining)`);
  }

  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && (Date.now() - cached.timestamp) < cached.ttl) {
      console.log(`ICAO cache hit for ${key}`);
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: any, ttlMinutes: number = 30): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMinutes * 60 * 1000
    });
  }

  getRemainingCalls(): { remaining: number; resetTime: string } {
    return {
      remaining: this.callLimit - this.callCount,
      resetTime: new Date(this.rateLimitReset).toISOString()
    };
  }

  private getHeaders() {
    const headers: any = {
      'Content-Type': 'application/json',
      'User-Agent': 'AINO-Aviation-Intelligence-Platform/1.0'
    };
    
    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }
    
    return headers;
  }

  /**
   * Get real-time flight data from ICAO with caching and rate limiting
   */
  async getFlightData(bounds?: {
    min_latitude: number;
    max_latitude: number;
    min_longitude: number;
    max_longitude: number;
  }): Promise<{
    success: boolean;
    flights: ICAOFlightData[];
    count: number;
    timestamp: string;
    data_source: string;
    cached?: boolean;
    calls_remaining?: number;
  }> {
    try {
      const cacheKey = bounds ? `flights_${JSON.stringify(bounds)}` : 'flights_global';
      
      // Check cache first
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        return {
          ...cached,
          cached: true,
          calls_remaining: this.callLimit - this.callCount
        };
      }

      // Check rate limit
      if (!this.canMakeCall()) {
        return {
          success: false,
          flights: [],
          count: 0,
          timestamp: new Date().toISOString(),
          data_source: 'ICAO_Rate_Limited',
          calls_remaining: 0
        };
      }

      let url = `${this.baseUrl}/flights/live`;
      
      if (bounds) {
        const params = new URLSearchParams({
          lat_min: bounds.min_latitude.toString(),
          lat_max: bounds.max_latitude.toString(),
          lon_min: bounds.min_longitude.toString(),
          lon_max: bounds.max_longitude.toString()
        });
        url += `?${params}`;
      }

      this.incrementCallCount();

      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 15000
      });

      const result = {
        success: true,
        flights: response.data?.flights || [],
        count: response.data?.flights?.length || 0,
        timestamp: new Date().toISOString(),
        data_source: 'ICAO_Official_Aviation_API',
        calls_remaining: this.callLimit - this.callCount
      };

      // Cache for 15 minutes for flight data
      this.setCachedData(cacheKey, result, 15);
      
      return result;

    } catch (error: any) {
      console.error('ICAO flight data error:', error.message);
      
      return {
        success: false,
        flights: [],
        count: 0,
        timestamp: new Date().toISOString(),
        data_source: 'ICAO_API_Error',
        calls_remaining: this.callLimit - this.callCount
      };
    }
  }

  /**
   * Get specific flight information by callsign
   */
  async getFlightByCallsign(callsign: string): Promise<ICAOFlightData | null> {
    try {
      const url = `${this.baseUrl}/flights/${callsign}`;
      
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 10000
      });

      if (response.data && response.data.flight) {
        return response.data.flight;
      }

      return null;
    } catch (error: any) {
      console.error(`ICAO flight lookup error for ${callsign}:`, error.message);
      return null;
    }
  }

  /**
   * Get airport information from ICAO
   */
  async getAirportData(icaoCode: string): Promise<ICAOAirportData | null> {
    try {
      const url = `${this.baseUrl}/airports/${icaoCode.toUpperCase()}`;
      
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 10000
      });

      if (response.data && response.data.airport) {
        return response.data.airport;
      }

      return null;
    } catch (error: any) {
      console.error(`ICAO airport data error for ${icaoCode}:`, error.message);
      return null;
    }
  }

  /**
   * Get NOTAMs from ICAO
   */
  async getNotams(icaoCode?: string): Promise<{
    success: boolean;
    notams: ICAONotamData[];
    count: number;
    timestamp: string;
  }> {
    try {
      let url = `${this.baseUrl}/notams`;
      
      if (icaoCode) {
        url += `/${icaoCode.toUpperCase()}`;
      }
      
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 15000
      });

      if (response.data && response.data.notams) {
        return {
          success: true,
          notams: response.data.notams,
          count: response.data.notams.length,
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: false,
        notams: [],
        count: 0,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      console.error('ICAO NOTAMs error:', error.message);
      return {
        success: false,
        notams: [],
        count: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get flight plan information
   */
  async getFlightPlan(callsign: string): Promise<{
    success: boolean;
    flight_plan?: {
      departure: string;
      destination: string;
      route: string[];
      estimated_time_enroute: number;
      cruise_altitude: number;
      aircraft_type: string;
      filed_time: string;
    };
  }> {
    try {
      const url = `${this.baseUrl}/flight-plans/${callsign}`;
      
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 10000
      });

      if (response.data && response.data.flight_plan) {
        return {
          success: true,
          flight_plan: response.data.flight_plan
        };
      }

      return { success: false };
    } catch (error: any) {
      console.error(`ICAO flight plan error for ${callsign}:`, error.message);
      return { success: false };
    }
  }

  /**
   * Test ICAO API connectivity and authentication
   */
  async testICAOConnection(): Promise<{
    success: boolean;
    status: string;
    authenticated: boolean;
    capabilities: string[];
    message: string;
  }> {
    try {
      const url = `${this.baseUrl}/status`;
      
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 10000
      });

      const authenticated = !!this.apiKey && response.status === 200;
      
      return {
        success: true,
        status: 'operational',
        authenticated,
        capabilities: [
          'real_time_flight_tracking',
          'official_airport_data',
          'notams',
          'flight_plans',
          'regulatory_compliance'
        ],
        message: authenticated 
          ? 'ICAO API fully operational with authentication' 
          : 'ICAO API accessible but authentication required for full features'
      };

    } catch (error: any) {
      if (error.response?.status === 401) {
        return {
          success: false,
          status: 'authentication_required',
          authenticated: false,
          capabilities: [],
          message: 'ICAO API key required for access'
        };
      } else if (error.response?.status === 403) {
        return {
          success: false,
          status: 'access_denied',
          authenticated: false,
          capabilities: [],
          message: 'ICAO API access denied - check credentials'
        };
      } else {
        return {
          success: false,
          status: 'unavailable',
          authenticated: false,
          capabilities: [],
          message: `ICAO API connection failed: ${error.message}`
        };
      }
    }
  }

  /**
   * Get Virgin Atlantic fleet specific data from ICAO
   */
  async getVirginAtlanticFleetData(): Promise<{
    success: boolean;
    fleet_aircraft: ICAOFlightData[];
    active_count: number;
    timestamp: string;
  }> {
    try {
      // Virgin Atlantic operator code search
      const url = `${this.baseUrl}/flights/operator/VIR`;
      
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 15000
      });

      if (response.data && response.data.flights) {
        return {
          success: true,
          fleet_aircraft: response.data.flights,
          active_count: response.data.flights.length,
          timestamp: new Date().toISOString()
        };
      }

      return {
        success: false,
        fleet_aircraft: [],
        active_count: 0,
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      console.error('ICAO Virgin Atlantic fleet data error:', error.message);
      return {
        success: false,
        fleet_aircraft: [],
        active_count: 0,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Get comprehensive aviation intelligence data
   */
  async getAviationIntelligence(): Promise<{
    success: boolean;
    data: {
      active_flights: number;
      operational_airports: number;
      active_notams: number;
      data_quality_score: number;
      coverage_regions: string[];
    };
    timestamp: string;
  }> {
    try {
      const [flightData, notamData] = await Promise.all([
        this.getFlightData(),
        this.getNotams()
      ]);

      const dataQualityScore = Math.min(100, 
        ((flightData.success ? 50 : 0) + (notamData.success ? 50 : 0))
      );

      return {
        success: true,
        data: {
          active_flights: flightData.count,
          operational_airports: 0, // Would be populated from airport status API
          active_notams: notamData.count,
          data_quality_score: dataQualityScore,
          coverage_regions: ['Global', 'ICAO_Member_States']
        },
        timestamp: new Date().toISOString()
      };

    } catch (error: any) {
      return {
        success: false,
        data: {
          active_flights: 0,
          operational_airports: 0,
          active_notams: 0,
          data_quality_score: 0,
          coverage_regions: []
        },
        timestamp: new Date().toISOString()
      };
    }
  }
}

export const icaoApiService = new ICAOApiService();