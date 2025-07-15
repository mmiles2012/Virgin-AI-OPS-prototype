import axios from 'axios';

interface ADSBExchangeAircraft {
  hex: string;
  type: string;
  flight: string;
  r: string; // registration
  t: string; // aircraft type
  alt_baro: number;
  alt_geom: number;
  gs: number; // ground speed
  ias: number; // indicated airspeed
  tas: number; // true airspeed
  mach: number;
  wd: number; // wind direction
  ws: number; // wind speed
  oat: number; // outside air temperature
  tat: number; // total air temperature
  track: number;
  track_rate: number;
  roll: number;
  mag_heading: number;
  true_heading: number;
  baro_rate: number;
  geom_rate: number;
  squawk: string;
  emergency: string;
  category: string;
  nav_qnh: number;
  nav_altitude_mcp: number;
  nav_altitude_fms: number;
  nav_heading: number;
  nav_modes: string[];
  lat: number;
  lon: number;
  nic: number;
  rc: number;
  version: number;
  nic_baro: number;
  nac_p: number;
  nac_v: number;
  sil: number;
  sil_type: string;
  gva: number;
  sda: number;
  mlat: string[];
  tisb: string[];
  messages: number;
  seen: number;
  rssi: number;
  dst: number; // distance from center point
  dir: number; // direction from center point
}

interface ADSBExchangeResponse {
  ac: ADSBExchangeAircraft[];
  ctime: number;
  ptime: number;
  total: number;
  msg: string;
}

interface FlightTrackingData {
  flight_number: string;
  callsign: string;
  registration: string;
  aircraft_type: string;
  latitude: number;
  longitude: number;
  altitude: number;
  ground_speed: number;
  heading: number;
  squawk: string;
  distance_km: number;
  last_seen_seconds: number;
  authentic_source: string;
  icao24: string;
  emergency: boolean;
  on_ground: boolean;
  data_quality: {
    position_accuracy: number;
    signal_strength: number;
    message_count: number;
  };
}

export class ADSBExchangeService {
  private rapidApiKey: string;
  private baseUrl = 'https://adsbexchange-com1.p.rapidapi.com/v2';
  private cache: Map<string, { data: FlightTrackingData[]; timestamp: number }> = new Map();
  private cacheTimeout = 30000; // 30 seconds

  constructor() {
    this.rapidApiKey = process.env.RAPIDAPI_KEY || '';
    if (!this.rapidApiKey) {
      console.warn('[ADS-B Exchange] RAPIDAPI_KEY not found in environment variables');
    }
  }

  private async makeRequest(endpoint: string): Promise<ADSBExchangeResponse | null> {
    try {
      const response = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: {
          'X-RapidAPI-Key': this.rapidApiKey,
          'X-RapidAPI-Host': 'adsbexchange-com1.p.rapidapi.com',
          'User-Agent': 'AINO-Aviation-Platform/1.0'
        },
        timeout: 10000
      });

      return response.data;
    } catch (error: any) {
      console.error(`[ADS-B Exchange] API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
      return null;
    }
  }

  private processAircraftData(aircraft: ADSBExchangeAircraft[]): FlightTrackingData[] {
    return aircraft
      .filter(ac => ac.lat && ac.lon && ac.flight) // Only aircraft with position and flight number
      .map(ac => ({
        flight_number: ac.flight?.trim() || ac.hex,
        callsign: ac.flight?.trim() || '',
        registration: ac.r || '',
        aircraft_type: ac.t || 'Unknown',
        latitude: ac.lat,
        longitude: ac.lon,
        altitude: ac.alt_baro || ac.alt_geom || 0,
        ground_speed: ac.gs || 0,
        heading: ac.track || ac.true_heading || ac.mag_heading || 0,
        squawk: ac.squawk || '',
        distance_km: ac.dst || 0,
        last_seen_seconds: ac.seen || 0,
        authentic_source: 'ADS-B Exchange',
        icao24: ac.hex,
        emergency: ac.emergency !== 'none' && ac.emergency !== '',
        on_ground: (ac.alt_baro || 0) < 100,
        data_quality: {
          position_accuracy: ac.nic || 0,
          signal_strength: ac.rssi || 0,
          message_count: ac.messages || 0
        }
      }));
  }

  // Get flights around London/UK area (covering Virgin Atlantic routes)
  async getUKFlights(): Promise<FlightTrackingData[]> {
    const cacheKey = 'uk_flights';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    // London coordinates: 51.4706, -0.4619
    // 250 nautical miles covers most of UK and approach routes
    const endpoint = `/lat/51.4706/lon/-0.4619/dist/250/`;
    const response = await this.makeRequest(endpoint);
    
    if (!response) {
      return [];
    }

    const flights = this.processAircraftData(response.ac);
    
    // Cache the results
    this.cache.set(cacheKey, {
      data: flights,
      timestamp: Date.now()
    });

    console.log(`[ADS-B Exchange] Found ${flights.length} flights in UK area`);
    return flights;
  }

  // Get flights around specific coordinates with custom distance
  async getFlightsAroundPosition(lat: number, lon: number, distanceNM: number = 100): Promise<FlightTrackingData[]> {
    const cacheKey = `flights_${lat}_${lon}_${distanceNM}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const endpoint = `/lat/${lat}/lon/${lon}/dist/${distanceNM}/`;
    const response = await this.makeRequest(endpoint);
    
    if (!response) {
      return [];
    }

    const flights = this.processAircraftData(response.ac);
    
    // Cache the results
    this.cache.set(cacheKey, {
      data: flights,
      timestamp: Date.now()
    });

    console.log(`[ADS-B Exchange] Found ${flights.length} flights around ${lat}, ${lon}`);
    return flights;
  }

  // Filter Virgin Atlantic flights from all tracked aircraft
  async getVirginAtlanticFlights(): Promise<FlightTrackingData[]> {
    const allFlights = await this.getUKFlights();
    
    // Virgin Atlantic flight patterns
    const virginAtlanticPatterns = [
      /^VS\d+/,     // VS followed by numbers
      /^VIR\d+/,    // VIR followed by numbers (ICAO callsign)
      /^VSV\d+/,    // Virgin Atlantic callsign variations
    ];

    const virginFlights = allFlights.filter(flight => {
      const callsign = flight.callsign.toUpperCase();
      const flightNumber = flight.flight_number.toUpperCase();
      
      return virginAtlanticPatterns.some(pattern => 
        pattern.test(callsign) || pattern.test(flightNumber)
      );
    });

    console.log(`[ADS-B Exchange] Found ${virginFlights.length} Virgin Atlantic flights`);
    return virginFlights;
  }

  // Get flight statistics and data quality metrics
  async getFlightStatistics(): Promise<{
    total_flights: number;
    virgin_atlantic_flights: number;
    data_quality: {
      high_accuracy: number;
      medium_accuracy: number;
      low_accuracy: number;
    };
    coverage_area: {
      center: { lat: number; lon: number };
      radius_nm: number;
    };
    last_update: string;
  }> {
    const allFlights = await this.getUKFlights();
    const virginFlights = await this.getVirginAtlanticFlights();

    const qualityStats = allFlights.reduce((acc, flight) => {
      const accuracy = flight.data_quality.position_accuracy;
      if (accuracy >= 7) acc.high_accuracy++;
      else if (accuracy >= 4) acc.medium_accuracy++;
      else acc.low_accuracy++;
      return acc;
    }, { high_accuracy: 0, medium_accuracy: 0, low_accuracy: 0 });

    return {
      total_flights: allFlights.length,
      virgin_atlantic_flights: virginFlights.length,
      data_quality: qualityStats,
      coverage_area: {
        center: { lat: 51.4706, lon: -0.4619 },
        radius_nm: 250
      },
      last_update: new Date().toISOString()
    };
  }

  // Health check for ADS-B Exchange service
  async healthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'error';
    api_key_configured: boolean;
    last_successful_call: string | null;
    error_message?: string;
  }> {
    if (!this.rapidApiKey) {
      return {
        status: 'error',
        api_key_configured: false,
        last_successful_call: null,
        error_message: 'RAPIDAPI_KEY not configured'
      };
    }

    try {
      // Test with a small area around London
      const testResponse = await this.makeRequest('/lat/51.4706/lon/-0.4619/dist/10/');
      
      if (testResponse) {
        return {
          status: 'healthy',
          api_key_configured: true,
          last_successful_call: new Date().toISOString()
        };
      } else {
        return {
          status: 'degraded',
          api_key_configured: true,
          last_successful_call: null,
          error_message: 'API request failed'
        };
      }
    } catch (error: any) {
      return {
        status: 'error',
        api_key_configured: true,
        last_successful_call: null,
        error_message: error.message
      };
    }
  }
}

export const adsbExchangeService = new ADSBExchangeService();