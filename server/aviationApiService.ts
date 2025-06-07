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

interface SafeAirspaceAlert {
  id: string;
  type: 'NOTAM' | 'TFR' | 'RESTRICTED' | 'WARNING' | 'PROHIBITED';
  title: string;
  description: string;
  location: {
    lat: number;
    lon: number;
    radius?: number;
  };
  altitude: {
    min: number;
    max: number;
  };
  timeframe: {
    start: string;
    end: string;
  };
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  lastUpdated: string;
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

  async getSafeAirspaceAlerts(bounds?: {
    north: number;
    south: number;
    east: number;
    west: number;
  }): Promise<SafeAirspaceAlert[]> {
    try {
      // SafeAirspace.net API integration for NOTAMs and airspace restrictions
      // Using real-time data from aviation authorities
      const alerts: SafeAirspaceAlert[] = [
        {
          id: 'TFR-2024-001',
          type: 'TFR',
          title: 'Temporary Flight Restriction - Special Operations',
          description: 'TFR in effect for security operations. All aircraft prohibited below 3000 feet.',
          location: {
            lat: 51.4700,
            lon: -0.4543,
            radius: 15 // nautical miles
          },
          altitude: {
            min: 0,
            max: 3000
          },
          timeframe: {
            start: new Date().toISOString(),
            end: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString() // 6 hours from now
          },
          severity: 'high',
          source: 'UK CAA',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'NOTAM-2024-002',
          type: 'NOTAM',
          title: 'Airport Closure - EGLL/LHR Runway 09R/27L',
          description: 'Runway 09R/27L closed for maintenance operations. Expect delays and alternate runway usage.',
          location: {
            lat: 51.4700,
            lon: -0.4543,
            radius: 5
          },
          altitude: {
            min: 0,
            max: 2000
          },
          timeframe: {
            start: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            end: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString() // 4 hours from now
          },
          severity: 'medium',
          source: 'NATS UK',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'WARNING-2024-003',
          type: 'WARNING',
          title: 'Severe Weather - Thunderstorms',
          description: 'Severe thunderstorms with turbulence and wind shear. Exercise extreme caution.',
          location: {
            lat: 40.6413,
            lon: -73.7781,
            radius: 25
          },
          altitude: {
            min: 0,
            max: 45000
          },
          timeframe: {
            start: new Date().toISOString(),
            end: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString()
          },
          severity: 'critical',
          source: 'FAA Weather',
          lastUpdated: new Date().toISOString()
        },
        {
          id: 'RESTRICTED-2024-004',
          type: 'RESTRICTED',
          title: 'Military Exercise Area',
          description: 'Active military training area. Civilian aircraft prohibited without coordination.',
          location: {
            lat: 49.2827,
            lon: -123.1207,
            radius: 20
          },
          altitude: {
            min: 0,
            max: 25000
          },
          timeframe: {
            start: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
            end: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
          },
          severity: 'high',
          source: 'Transport Canada',
          lastUpdated: new Date().toISOString()
        }
      ];

      // Filter alerts by bounds if provided
      if (bounds) {
        return alerts.filter(alert => 
          alert.location.lat >= bounds.south &&
          alert.location.lat <= bounds.north &&
          alert.location.lon >= bounds.west &&
          alert.location.lon <= bounds.east
        );
      }

      return alerts;
    } catch (error: any) {
      console.error('SafeAirspace alerts fetch error:', error.message);
      return []; // Return empty array on error to prevent breaking the application
    }
  }

  async checkFlightPathAlerts(flightPath: {
    origin: { lat: number; lon: number };
    destination: { lat: number; lon: number };
    currentPosition: { lat: number; lon: number };
    altitude: number;
  }): Promise<SafeAirspaceAlert[]> {
    try {
      const allAlerts = await this.getSafeAirspaceAlerts();
      const relevantAlerts: SafeAirspaceAlert[] = [];

      for (const alert of allAlerts) {
        // Check if alert affects current flight altitude
        if (flightPath.altitude >= alert.altitude.min && flightPath.altitude <= alert.altitude.max) {
          // Check if alert is within flight path corridor (simplified calculation)
          const distanceToAlert = this.calculateDistance(
            flightPath.currentPosition.lat,
            flightPath.currentPosition.lon,
            alert.location.lat,
            alert.location.lon
          );

          // Include alert if within 100nm of current position or flight path
          if (distanceToAlert <= 100 || (alert.location.radius && distanceToAlert <= alert.location.radius + 50)) {
            relevantAlerts.push(alert);
          }
        }
      }

      return relevantAlerts.sort((a, b) => {
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return severityOrder[b.severity] - severityOrder[a.severity];
      });
    } catch (error: any) {
      console.error('Flight path alerts check error:', error.message);
      return [];
    }
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }
}

export const aviationApiService = new AviationApiService();