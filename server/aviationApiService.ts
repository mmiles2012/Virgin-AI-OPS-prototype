import axios from 'axios';

interface AviationStackResponse {
  data: any[];
  pagination?: {
    limit: number;
    offset: number;
    count: number;
    total: number;
  };
}

interface OpenSkyResponse {
  time: number;
  states: any[][];
}

interface FlightData {
  callsign: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  aircraft: string;
  origin?: string;
  destination?: string;
}

export class AviationApiService {
  private aviationStackKey: string;
  private openskyUsername: string;
  private openskyPassword: string;
  private mapboxKey: string;

  constructor() {
    this.aviationStackKey = process.env.AVIATIONSTACK_API_KEY || '454bb19ed534574d0d562d4785d7a1eb';
    this.openskyUsername = process.env.OPENSKY_USERNAME || '';
    this.openskyPassword = process.env.OPENSKY_PASSWORD || '';
    this.mapboxKey = process.env.MAPBOX_PUBLIC_KEY || '';
  }

  async testAviationStack(): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.aviationStackKey) {
      return {
        success: false,
        message: 'AviationStack API key not configured'
      };
    }

    try {
      const response = await axios.get('http://api.aviationstack.com/v1/flights', {
        params: {
          access_key: this.aviationStackKey,
          limit: 5,
          flight_status: 'active'
        },
        timeout: 10000
      });

      if (response.data && response.data.data) {
        return {
          success: true,
          message: `Successfully retrieved ${response.data.data.length} active flights`,
          data: {
            flights_found: response.data.data.length,
            sample_flight: response.data.data[0] ? {
              flight_number: response.data.data[0].flight?.iata,
              aircraft: response.data.data[0].aircraft?.iata,
              departure: response.data.data[0].departure?.airport,
              arrival: response.data.data[0].arrival?.airport,
              status: response.data.data[0].flight_status
            } : null,
            api_credits_used: response.data.pagination?.count || 0
          }
        };
      } else {
        return {
          success: false,
          message: 'No flight data received from AviationStack API'
        };
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Invalid AviationStack API key - please check credentials'
        };
      } else if (error.response?.status === 403) {
        return {
          success: false,
          message: 'AviationStack API access denied - check subscription limits'
        };
      } else {
        return {
          success: false,
          message: `AviationStack API error: ${error.message}`
        };
      }
    }
  }

  async testOpenSky(): Promise<{ success: boolean; message: string; data?: any }> {
    try {
      const response = await axios.get('https://opensky-network.org/api/states/all', {
        params: {
          lamin: 40.0,
          lamax: 41.0,
          lomin: -74.5,
          lomax: -73.5
        },
        timeout: 15000,
        headers: {
          'User-Agent': 'AINO-Aviation-Operations/1.0'
        }
      });

      if (response.data && response.data.states) {
        const aircraftCount = response.data.states.length;
        const sampleAircraft = response.data.states[0];
        
        return {
          success: true,
          message: `Successfully retrieved ${aircraftCount} aircraft positions`,
          data: {
            aircraft_found: aircraftCount,
            sample_aircraft: sampleAircraft ? {
              callsign: sampleAircraft[1]?.trim() || 'Unknown',
              latitude: sampleAircraft[6],
              longitude: sampleAircraft[5],
              altitude: sampleAircraft[7],
              velocity: sampleAircraft[9],
              heading: sampleAircraft[10]
            } : null,
            timestamp: response.data.time,
            authenticated: false
          }
        };
      } else {
        return {
          success: false,
          message: 'No aircraft data received from OpenSky Network'
        };
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'OpenSky Network authentication failed - check username/password'
        };
      } else if (error.response?.status === 429) {
        return {
          success: false,
          message: 'OpenSky Network rate limit exceeded - try again later'
        };
      } else {
        return {
          success: false,
          message: `OpenSky Network error: ${error.message}`
        };
      }
    }
  }

  async testMapbox(): Promise<{ success: boolean; message: string; data?: any }> {
    if (!this.mapboxKey) {
      return {
        success: false,
        message: 'Mapbox API key not configured'
      };
    }

    try {
      // Test Mapbox Geocoding API
      const response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/Los%20Angeles%20International%20Airport.json`, {
        params: {
          access_token: this.mapboxKey,
          limit: 1,
          types: 'poi'
        },
        timeout: 10000
      });

      if (response.data && response.data.features) {
        const airport = response.data.features[0];
        return {
          success: true,
          message: 'Successfully connected to Mapbox services',
          data: {
            geocoding_test: 'passed',
            sample_result: {
              place_name: airport.place_name,
              coordinates: airport.geometry.coordinates,
              place_type: airport.place_type
            },
            available_services: [
              'Satellite Imagery',
              'Vector Maps',
              'Geocoding',
              'Navigation'
            ]
          }
        };
      } else {
        return {
          success: false,
          message: 'No geocoding results from Mapbox API'
        };
      }
    } catch (error: any) {
      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Invalid Mapbox API key - please check credentials'
        };
      } else {
        return {
          success: false,
          message: `Mapbox API error: ${error.message}`
        };
      }
    }
  }

  async getVirginAtlanticFlights(): Promise<FlightData[]> {
    try {
      // Get all current flights from OpenSky Network
      const response = await axios.get('https://opensky-network.org/api/states/all', {
        timeout: 20000,
        headers: {
          'User-Agent': 'AINO-Aviation-Operations/1.0'
        }
      });

      const flights: FlightData[] = [];
      
      if (response.data && response.data.states) {
        // Filter for Virgin Atlantic flights (callsigns starting with VIR)
        for (const state of response.data.states) {
          const [
            icao24, callsign, origin_country, time_position,
            last_contact, longitude, latitude, baro_altitude,
            on_ground, velocity, true_track, vertical_rate
          ] = state;

          if (callsign && callsign.trim().toUpperCase().startsWith('VIR') && latitude && longitude) {
            flights.push({
              callsign: callsign.trim(),
              latitude: latitude,
              longitude: longitude,
              altitude: baro_altitude ? Math.round(baro_altitude * 3.28084) : 0, // Convert meters to feet
              velocity: velocity ? Math.round(velocity * 1.94384) : 0, // Convert m/s to knots
              heading: true_track || 0,
              aircraft: 'Virgin Atlantic',
              origin: origin_country,
              destination: 'Unknown'
            });
          }
        }
      }

      return flights;
    } catch (error: any) {
      console.warn('OpenSky Network error:', error.message);
      throw new Error(`Failed to fetch Virgin Atlantic flights: ${error.message}`);
    }
  }



  async getLiveAircraftPositions(bounds?: {
    latMin: number;
    latMax: number;
    lonMin: number;
    lonMax: number;
  }): Promise<FlightData[]> {
    try {
      // Use public OpenSky Network API without authentication
      const params: any = {};
      if (bounds) {
        params.lamin = bounds.latMin;
        params.lamax = bounds.latMax;
        params.lomin = bounds.lonMin;
        params.lomax = bounds.lonMax;
      }

      const response = await axios.get('https://opensky-network.org/api/states/all', {
        params,
        timeout: 20000,
        headers: {
          'User-Agent': 'AINO-Aviation-Operations/1.0'
        }
      });

      const aircraft: FlightData[] = [];
      
      if (response.data && response.data.states) {
        for (const state of response.data.states) {
          const [
            icao24, callsign, origin_country, time_position,
            last_contact, longitude, latitude, baro_altitude,
            on_ground, velocity, true_track, vertical_rate
          ] = state;

          if (latitude && longitude) { // Has valid coordinates
            aircraft.push({
              callsign: callsign?.trim() || icao24,
              latitude: latitude,
              longitude: longitude,
              altitude: baro_altitude ? Math.round(baro_altitude * 3.28084) : 0, // Convert meters to feet
              velocity: velocity ? Math.round(velocity * 1.94384) : 0, // Convert m/s to knots
              heading: true_track || 0,
              aircraft: 'Unknown',
              origin: origin_country,
              destination: 'Unknown'
            });
          }
        }
      }

      return aircraft;
    } catch (error: any) {
      throw new Error(`Failed to fetch live aircraft positions: ${error.message}`);
    }
  }

  async getAirportInformation(icaoCode: string): Promise<any> {
    if (!this.aviationStackKey) {
      throw new Error('AviationStack API key not configured');
    }

    try {
      const response = await axios.get('http://api.aviationstack.com/v1/airports', {
        params: {
          access_key: this.aviationStackKey,
          search: icaoCode
        },
        timeout: 10000
      });

      return response.data?.data?.[0] || null;
    } catch (error: any) {
      throw new Error(`Failed to fetch airport information: ${error.message}`);
    }
  }
}

export const aviationApiService = new AviationApiService();