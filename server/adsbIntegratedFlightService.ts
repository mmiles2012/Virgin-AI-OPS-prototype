import axios from 'axios';
import { virginAtlanticService } from './virginAtlanticService';
import { adsbExchangeService } from './adsbExchangeService';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const AuthenticVirginAtlanticTracker = require('./authenticVirginAtlanticTracker');

interface EnhancedFlightData {
  flight_number: string;
  airline: string;
  aircraft_type: string;
  route: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  status: string;
  registration?: string;
  icao24?: string;
  data_source: string;
  authentic_tracking: boolean;
  last_seen?: number;
  emergency?: string;
  signal_strength?: string;
  departure_airport: string;
  arrival_airport: string;
  departure_time: string;
  arrival_time?: string;
  frequency?: string;
  gate?: string;
  terminal?: string;
  callsign?: string;
  aircraft?: string;
  origin?: string;
  destination?: string;
  scheduled_departure?: string;
  scheduled_arrival?: string;
  current_status?: string;
  flight_progress?: number;
  distance_remaining?: number;
  delay_minutes?: number;
  fuel_remaining?: number;
  warnings?: string[];
  digital_twin_data?: any;
}

class ADSBIntegratedFlightService {
  private cache: Map<string, EnhancedFlightData[]> = new Map();
  private cacheTimeout = 30000; // 30 seconds
  private lastFetch = 0;
  private authenticTracker: any;

  constructor() {
    this.authenticTracker = new AuthenticVirginAtlanticTracker();
    console.log('ADS-B Integrated Flight Service: Initialized with authentic ADS-B Exchange data priority');
  }

  async getEnhancedFlightData(): Promise<EnhancedFlightData[]> {
    const now = Date.now();
    
    // Check cache first (extend cache to reduce rate limiting)
    if (now - this.lastFetch < (this.cacheTimeout * 4) && this.cache.has('enhanced_flights')) {
      console.log('🔍 Using cached enhanced Virgin Atlantic flights to avoid rate limiting');
      return this.cache.get('enhanced_flights') || [];
    }

    try {
      console.log('🔍 Fetching enhanced Virgin Atlantic flights using authentic ADS-B Exchange data...');
      
      // Step 1: Get authentic ADS-B Exchange data
      const authenticFlights = await this.authenticTracker.getAINOFormattedFlights();
      
      let enhancedFlights: EnhancedFlightData[] = [];
      
      if (authenticFlights.success && authenticFlights.flights.length > 0) {
        console.log(`✈️  Found ${authenticFlights.flights.length} authentic Virgin Atlantic flights via ADS-B Exchange`);
        enhancedFlights = authenticFlights.flights.map((flight: any) => ({
          ...flight,
          data_source: 'ADS-B Exchange',
          authentic_tracking: true
        }));
      } else {
        console.log('No authentic flights found, using simulated Virgin Atlantic data as fallback');
        // Step 2: Only if no authentic flights, use simulated data
        const simulatedFlights = await this.getSimulatedFlights();
        enhancedFlights = simulatedFlights.map((flight: any) => ({
          ...flight,
          data_source: 'Simulated (Virgin Atlantic Schedule)',
          authentic_tracking: false
        }));
      }
      
      // Update cache
      this.cache.set('enhanced_flights', enhancedFlights);
      this.lastFetch = now;
      
      console.log(`Flight Service: Delivered ${enhancedFlights.length} flights with ${authenticFlights.success ? 'authentic' : 'simulated'} data`);
      
      return enhancedFlights;
      
    } catch (error) {
      console.error('Error in enhanced flight service:', error);
      
      // Fallback to simulated data
      const simulatedFlights = await this.getSimulatedFlights();
      this.cache.set('enhanced_flights', simulatedFlights);
      this.lastFetch = now;
      
      return simulatedFlights;
    }
  }

  private async getSimulatedFlights(): Promise<EnhancedFlightData[]> {
    try {
      const response = await axios.get('http://localhost:5000/api/aviation/virgin-atlantic-flights');
      const flightData = response.data;
      
      if (flightData.success && flightData.flights) {
        return flightData.flights.map((flight: any) => ({
          ...flight,
          data_source: 'Simulated',
          authentic_tracking: false
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching simulated flights:', error);
      return [];
    }
  }

  // Removed OpenSky Network methods - now using authentic ADS-B Exchange only

  async getFlightByCallsign(callsign: string): Promise<EnhancedFlightData | null> {
    const flights = await this.getEnhancedFlightData();
    return flights.find(f => f.flight_number === callsign) || null;
  }

  async getFlightStats(): Promise<any> {
    const flights = await this.getEnhancedFlightData();
    const authenticFlights = flights.filter(f => f.authentic_tracking);
    
    return {
      total_flights: flights.length,
      authentic_flights: authenticFlights.length,
      simulated_flights: flights.length - authenticFlights.length,
      authentic_percentage: flights.length > 0 ? Math.round((authenticFlights.length / flights.length) * 100) : 0,
      data_sources: {
        'ADS-B Exchange': authenticFlights.length,
        'Simulated': flights.length - authenticFlights.length
      }
    };
  }
}

export const adsbIntegratedFlightService = new ADSBIntegratedFlightService();