import axios from 'axios';

interface RapidApiFlightData {
  hex: string;
  type?: string;
  flight?: string;
  r?: string; // registration
  t?: string; // aircraft type
  alt_baro?: number;
  alt_geom?: number;
  gs?: number; // ground speed
  track?: number;
  lat?: number;
  lon?: number;
  seen?: number;
  messages?: number;
  rssi?: number;
  emergency?: string;
  squawk?: string;
  category?: string;
}

interface ProcessedFlightData {
  flight_number: string;
  airline: string;
  aircraft_type: string;
  registration: string;
  icao24: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  data_source: string;
  authentic_tracking: boolean;
  last_seen: number;
  emergency?: string;
  signal_strength: string;
}

class ADSBRapidApiService {
  private rapidApiHost = process.env.RAPIDAPI_HOST || 'adsbexchange-com1.p.rapidapi.com';
  private cache: Map<string, ProcessedFlightData[]> = new Map();
  private cacheTimeout = 30000; // 30 seconds
  private lastFetch = 0;

  private getHeaders() {
    return {
      'X-RapidAPI-Key': process.env.RAPIDAPI_KEY || '',
      'X-RapidAPI-Host': this.rapidApiHost
    };
  }

  // Get all flights in a specific area (UK region for Virgin Atlantic)
  async getFlightsInRegion(lat: number, lon: number, radius: number = 250): Promise<ProcessedFlightData[]> {
    const cacheKey = `region_${lat}_${lon}_${radius}`;
    
    // Check cache first
    if (this.cache.has(cacheKey) && Date.now() - this.lastFetch < this.cacheTimeout) {
      return this.cache.get(cacheKey) || [];
    }

    try {
      const url = `https://${this.rapidApiHost}/v2/lat/${lat}/lon/${lon}/dist/${radius}/`;
      console.log(`🔍 Fetching ADS-B data from: ${url}`);
      
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 10000
      });
      
      console.log(`📡 Response status: ${response.status}, data keys:`, Object.keys(response.data));

      const flights = this.processFlightData(response.data);
      this.cache.set(cacheKey, flights);
      this.lastFetch = Date.now();
      
      return flights;
    } catch (error) {
      console.error('Error fetching flights from RapidAPI:', error);
      if (axios.isAxiosError(error)) {
        console.error('Response status:', error.response?.status);
        console.error('Response data:', error.response?.data);
        
        if (error.response?.status === 403) {
          const data = error.response.data;
          if (data?.message === 'You are not subscribed to this API.') {
            console.error('❌ ADS-B Exchange API Subscription Required');
            console.error('   Please subscribe to ADS-B Exchange API on RapidAPI.com');
            console.error('   Current key is valid but not subscribed to this specific API');
          }
        }
      }
      return [];
    }
  }

  // Get Virgin Atlantic flights specifically
  async getVirginAtlanticFlights(): Promise<ProcessedFlightData[]> {
    try {
      // Use exact coordinates from Python code: Heathrow region
      const heathrowFlights = await this.getFlightsInRegion(51.4700, -0.4543, 500);
      
      // Filter for Virgin Atlantic flights (same as Python code)
      const virginFlights = heathrowFlights.filter(flight => 
        flight.flight_number.startsWith('VIR') || 
        flight.flight_number.startsWith('VS') ||
        flight.registration.startsWith('G-V')
      );

      console.log(`🔍 Found ${virginFlights.length} Virgin Atlantic flights from ${heathrowFlights.length} total flights`);
      return virginFlights;
    } catch (error) {
      console.error('Error fetching Virgin Atlantic flights:', error);
      return [];
    }
  }

  // Get flights by hex code (ICAO24)
  async getFlightByHex(hex: string): Promise<ProcessedFlightData | null> {
    try {
      const response = await axios.get(`${this.baseURL}hex/${hex}/`, {
        headers: this.getHeaders(),
        timeout: 10000
      });

      const flights = this.processFlightData(response.data);
      return flights.length > 0 ? flights[0] : null;
    } catch (error) {
      console.error('Error fetching flight by hex:', error);
      return null;
    }
  }

  // Process raw flight data from API
  private processFlightData(data: any): ProcessedFlightData[] {
    // Handle subscription error response
    if (data && data.message === 'You are not subscribed to this API.') {
      console.log('🔒 ADS-B Exchange subscription required for authentic flight data');
      return [];
    }
    
    if (!data || !data.ac || !Array.isArray(data.ac)) {
      return [];
    }

    return data.ac.map((aircraft: RapidApiFlightData) => {
      const flight: ProcessedFlightData = {
        flight_number: aircraft.flight || aircraft.hex,
        airline: this.getAirlineFromCallsign(aircraft.flight || ''),
        aircraft_type: aircraft.t || 'Unknown',
        registration: aircraft.r || '',
        icao24: aircraft.hex,
        latitude: aircraft.lat || 0,
        longitude: aircraft.lon || 0,
        altitude: aircraft.alt_baro || aircraft.alt_geom || 0,
        velocity: aircraft.gs || 0,
        heading: aircraft.track || 0,
        data_source: 'ADS-B Exchange (RapidAPI)',
        authentic_tracking: true,
        last_seen: aircraft.seen || 0,
        emergency: aircraft.emergency || undefined,
        signal_strength: this.getSignalStrength(aircraft.rssi || 0)
      };

      return flight;
    }).filter(flight => flight.latitude !== 0 && flight.longitude !== 0);
  }

  // Get airline from callsign
  private getAirlineFromCallsign(callsign: string): string {
    if (callsign.startsWith('VIR') || callsign.startsWith('VS')) {
      return 'Virgin Atlantic';
    }
    if (callsign.startsWith('BAW')) {
      return 'British Airways';
    }
    if (callsign.startsWith('AAL')) {
      return 'American Airlines';
    }
    if (callsign.startsWith('DAL')) {
      return 'Delta Air Lines';
    }
    if (callsign.startsWith('UAL')) {
      return 'United Airlines';
    }
    return 'Unknown';
  }

  // Convert RSSI to signal strength
  private getSignalStrength(rssi: number): string {
    if (rssi > -50) return 'Excellent';
    if (rssi > -70) return 'Good';
    if (rssi > -85) return 'Fair';
    return 'Poor';
  }

  // Get flight statistics
  async getFlightStatistics(): Promise<{
    total_flights: number;
    authentic_flights: number;
    virgin_atlantic_flights: number;
    data_sources: string[];
    last_update: string;
  }> {
    const allFlights = await this.getFlightsInRegion(51.5074, -0.1278, 300);
    const virginFlights = await this.getVirginAtlanticFlights();

    return {
      total_flights: allFlights.length,
      authentic_flights: allFlights.length,
      virgin_atlantic_flights: virginFlights.length,
      data_sources: ['ADS-B Exchange (RapidAPI)'],
      last_update: new Date().toISOString()
    };
  }

  // Health check with subscription status
  async healthCheck(): Promise<{ healthy: boolean; message: string; subscription_active: boolean }> {
    try {
      const url = `https://${this.rapidApiHost}/v2/lat/51.5/lon/-0.1/dist/50/`;
      const response = await axios.get(url, {
        headers: this.getHeaders(),
        timeout: 5000
      });
      
      if (response.status === 200 && response.data.ac !== undefined) {
        return {
          healthy: true,
          message: 'ADS-B Exchange API active and subscribed',
          subscription_active: true
        };
      } else {
        return {
          healthy: false,
          message: 'Unexpected response format from ADS-B Exchange API',
          subscription_active: false
        };
      }
    } catch (error) {
      console.error('ADS-B Exchange health check failed:', error);
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 403) {
          const data = error.response.data;
          if (data?.message === 'You are not subscribed to this API.') {
            return {
              healthy: false,
              message: 'RapidAPI key valid but not subscribed to ADS-B Exchange API',
              subscription_active: false
            };
          }
        } else if (error.response?.status === 401) {
          return {
            healthy: false,
            message: 'Invalid RapidAPI key',
            subscription_active: false
          };
        } else if (error.response?.status === 429) {
          const data = error.response.data;
          if (data?.message === 'Too many requests') {
            return {
              healthy: true,
              message: 'ADS-B Exchange API subscribed but rate limited (will retry)',
              subscription_active: true
            };
          }
        }
      }
      
      return {
        healthy: false,
        message: 'Network or API error',
        subscription_active: false
      };
    }
  }
}

export const adsbRapidApiService = new ADSBRapidApiService();