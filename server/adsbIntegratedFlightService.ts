import axios from 'axios';
import { virginAtlanticService } from './virginAtlanticService';
import { adsbExchangeService } from './adsbExchangeService';

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

  constructor() {
    console.log('ADS-B Integrated Flight Service: Initialized with real-time data priority');
  }

  async getEnhancedFlightData(): Promise<EnhancedFlightData[]> {
    const now = Date.now();
    
    // Check cache first
    if (now - this.lastFetch < this.cacheTimeout && this.cache.has('enhanced_flights')) {
      return this.cache.get('enhanced_flights') || [];
    }

    try {
      // Step 1: Get simulated Virgin Atlantic flights as baseline
      const simulatedFlights = await this.getSimulatedFlights();
      
      // Step 2: Try to get real ADS-B Exchange data
      const adsbFlights = await this.getADSBFlights();
      
      // Step 3: Merge real data with simulated data
      const enhancedFlights = this.mergeFlightData(simulatedFlights, adsbFlights);
      
      // Update cache
      this.cache.set('enhanced_flights', enhancedFlights);
      this.lastFetch = now;
      
      console.log(`Flight Service: Enhanced ${enhancedFlights.length} flights with ${adsbFlights.length} real ADS-B tracks`);
      
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

  private async getADSBFlights(): Promise<EnhancedFlightData[]> {
    try {
      const response = await axios.get('http://localhost:5000/api/flights/virgin-atlantic-adsb');
      const adsbData = response.data;
      
      if (adsbData.success && adsbData.flights) {
        return adsbData.flights.map((flight: any) => ({
          ...flight,
          data_source: 'ADS-B Exchange',
          authentic_tracking: true
        }));
      }
      
      return [];
    } catch (error) {
      console.error('Error fetching ADS-B flights:', error);
      return [];
    }
  }

  private mergeFlightData(simulated: EnhancedFlightData[], adsb: EnhancedFlightData[]): EnhancedFlightData[] {
    const merged: EnhancedFlightData[] = [];
    const adsbCallsigns = new Set(adsb.map(f => f.flight_number));
    
    // Add all ADS-B flights first (priority)
    merged.push(...adsb);
    
    // Add simulated flights that don't have ADS-B data
    simulated.forEach(flight => {
      if (!adsbCallsigns.has(flight.flight_number)) {
        merged.push(flight);
      }
    });
    
    return merged;
  }

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