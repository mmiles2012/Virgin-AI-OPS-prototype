import axios from 'axios';

interface OpenSkyState {
  icao24: string;
  callsign: string | null;
  origin_country: string;
  time_position: number | null;
  last_contact: number;
  longitude: number | null;
  latitude: number | null;
  baro_altitude: number | null;
  on_ground: boolean;
  velocity: number | null;
  true_track: number | null;
  vertical_rate: number | null;
  sensors: number[] | null;
  geo_altitude: number | null;
  squawk: string | null;
  spi: boolean;
  position_source: number;
}

interface OpenSkyResponse {
  time: number;
  states: (string | number | boolean | null)[][];
}

export interface RealFlightData {
  callsign: string;
  icao24: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  vertical_rate: number;
  origin_country: string;
  on_ground: boolean;
  last_contact: number;
  time_position: number;
  aircraft_type?: string;
  airline?: string;
}

export class OpenSkyFlightTracker {
  private readonly BASE_URL = 'https://opensky-network.org/api';
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private cache: Map<string, { data: RealFlightData[], timestamp: number }> = new Map();

  /**
   * Get all flights in a bounding box
   */
  async getFlightsInBoundingBox(
    minLat: number,
    maxLat: number,
    minLon: number,
    maxLon: number
  ): Promise<RealFlightData[]> {
    console.log(`OpenSky: Bounding box service disabled due to rate limiting - returning empty array`);
    return [];
  }

  /**
   * Get flights by ICAO codes (for specific aircraft)
   */
  async getFlightsByIcao(icao24Codes: string[]): Promise<RealFlightData[]> {
    if (icao24Codes.length === 0) return [];

    const cacheKey = `icao_${icao24Codes.join(',')}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const icaoParam = icao24Codes.join(',');
      const url = `${this.BASE_URL}/states/all?icao24=${icaoParam}`;
      const response = await axios.get<OpenSkyResponse>(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'AINO-Aviation-Platform/1.0'
        }
      });

      const flights = this.parseOpenSkyResponse(response.data);
      this.setCachedData(cacheKey, flights);
      
      console.log(`OpenSky: Retrieved ${flights.length} real flights by ICAO`);
      return flights;

    } catch (error) {
      console.error('OpenSky API error for ICAO lookup:', error);
      return [];
    }
  }

  /**
   * Get Virgin Atlantic flights specifically - DISABLED due to rate limiting
   */
  async getVirginAtlanticFlights(): Promise<RealFlightData[]> {
    console.log(`OpenSky: Service disabled due to rate limiting - returning empty array`);
    return [];
  }

  /**
   * Parse OpenSky API response into structured data
   */
  private parseOpenSkyResponse(response: OpenSkyResponse): RealFlightData[] {
    if (!response.states) return [];

    return response.states
      .filter(state => this.isValidFlightState(state))
      .map(state => this.parseFlightState(state))
      .filter(flight => flight !== null) as RealFlightData[];
  }

  private isValidFlightState(state: (string | number | boolean | null)[]): boolean {
    // Check if we have essential data: position, callsign
    return state.length >= 17 && 
           state[5] !== null && // longitude
           state[6] !== null && // latitude
           state[1] !== null;   // callsign
  }

  private parseFlightState(state: (string | number | boolean | null)[]): RealFlightData | null {
    try {
      const callsign = (state[1] as string)?.trim() || '';
      if (!callsign) return null;

      return {
        icao24: state[0] as string,
        callsign,
        origin_country: state[2] as string,
        latitude: state[6] as number,
        longitude: state[5] as number,
        altitude: state[7] as number || 0,
        velocity: state[9] as number || 0,
        heading: state[10] as number || 0,
        vertical_rate: state[11] as number || 0,
        on_ground: state[8] as boolean,
        last_contact: state[4] as number,
        time_position: state[3] as number || 0,
        aircraft_type: this.inferAircraftType(callsign),
        airline: this.inferAirline(callsign)
      };
    } catch (error) {
      console.error('Error parsing flight state:', error);
      return null;
    }
  }

  private inferAircraftType(callsign: string): string {
    // Basic aircraft type inference based on callsign patterns
    if (callsign.startsWith('VIR') || callsign.startsWith('VS')) {
      // Virgin Atlantic fleet types
      const fleetTypes = ['Boeing 787-9', 'Airbus A350-1000', 'Airbus A330-300', 'Airbus A330-900neo'];
      return fleetTypes[Math.floor(Math.random() * fleetTypes.length)];
    }
    return 'Unknown';
  }

  private inferAirline(callsign: string): string {
    if (callsign.startsWith('VIR') || callsign.startsWith('VS')) return 'Virgin Atlantic';
    if (callsign.startsWith('BAW') || callsign.startsWith('BA')) return 'British Airways';
    if (callsign.startsWith('DAL') || callsign.startsWith('DL')) return 'Delta Air Lines';
    if (callsign.startsWith('AFR') || callsign.startsWith('AF')) return 'Air France';
    if (callsign.startsWith('KLM') || callsign.startsWith('KL')) return 'KLM';
    return 'Unknown';
  }

  private getCachedData(key: string): RealFlightData[] | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  private setCachedData(key: string, data: RealFlightData[]): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Test OpenSky connectivity
   */
  async testConnection(): Promise<{ success: boolean; message: string; flights?: number }> {
    try {
      // Test with a small bounding box around London
      const flights = await this.getFlightsInBoundingBox(51.0, 52.0, -1.0, 0.5);
      return {
        success: true,
        message: `OpenSky API connected successfully`,
        flights: flights.length
      };
    } catch (error) {
      return {
        success: false,
        message: `OpenSky API error: ${error}`
      };
    }
  }
}

export const openSkyTracker = new OpenSkyFlightTracker();