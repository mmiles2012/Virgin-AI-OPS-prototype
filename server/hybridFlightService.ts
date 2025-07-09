/**
 * Hybrid Flight Service - Combines FlightAware AeroAPI with ADS-B Exchange data
 * Provides comprehensive flight tracking using both authentic data sources
 */

import { flightAwareService } from './flightAwareService';
import { adsbIntegratedFlightService } from './adsbIntegratedFlightService';

interface HybridFlightData {
  // Core identification
  callsign: string;
  flight_number: string;
  registration?: string;
  aircraft_type: string;
  
  // Route information (FlightAware)
  origin: string;
  destination: string;
  scheduled_departure?: string;
  scheduled_arrival?: string;
  actual_departure?: string;
  actual_arrival?: string;
  
  // Real-time position (ADS-B Exchange)
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  last_contact?: number;
  
  // Status and progress
  status: string;
  flight_progress?: number;
  distance_remaining?: number;
  
  // Data sources
  data_sources: {
    position: 'ADS-B' | 'FlightAware' | 'Fallback';
    schedule: 'FlightAware' | 'Fallback';
    route: 'FlightAware' | 'Fallback';
  };
  
  // Enhanced data
  waypoints?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    altitude: number;
    eta?: number;
  }>;
  
  // Quality indicators
  data_quality: {
    position_accuracy: 'HIGH' | 'MEDIUM' | 'LOW';
    schedule_accuracy: 'HIGH' | 'MEDIUM' | 'LOW';
    last_updated: string;
  };
}

class HybridFlightService {
  private cache: Map<string, { data: HybridFlightData[]; timestamp: number }> = new Map();
  private readonly cacheTimeout = 30000; // 30 seconds

  /**
   * Get comprehensive Virgin Atlantic flight data combining both sources
   */
  async getVirginAtlanticFlights(): Promise<HybridFlightData[]> {
    const cacheKey = 'virgin-atlantic-hybrid';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      console.log('[Hybrid] Using cached Virgin Atlantic hybrid data');
      return cached.data;
    }

    try {
      console.log('[Hybrid] Fetching Virgin Atlantic data from both FlightAware and ADS-B sources...');
      
      // Get data from both sources simultaneously
      const [flightAwareData, adsbData] = await Promise.all([
        this.getFlightAwareData(),
        this.getAdsbData()
      ]);

      console.log(`[Hybrid] FlightAware: ${flightAwareData.length} flights, ADS-B: ${adsbData.length} flights`);

      // Merge and enhance the data
      const hybridFlights = this.mergeFlightData(flightAwareData, adsbData);
      
      // Cache the results
      this.cache.set(cacheKey, { data: hybridFlights, timestamp: Date.now() });
      
      console.log(`[Hybrid] Generated ${hybridFlights.length} hybrid Virgin Atlantic flights`);
      return hybridFlights;
      
    } catch (error) {
      console.error('[Hybrid] Failed to get hybrid flight data:', error);
      
      // Fallback to ADS-B only if FlightAware fails
      try {
        const adsbData = await this.getAdsbData();
        return this.convertAdsbToHybrid(adsbData);
      } catch (adsbError) {
        console.error('[Hybrid] Both sources failed, returning empty array');
        return [];
      }
    }
  }

  /**
   * Get FlightAware data with error handling
   */
  private async getFlightAwareData(): Promise<any[]> {
    try {
      const flights = await flightAwareService.getVirginAtlanticFlights();
      console.log(`[Hybrid] FlightAware provided ${flights.length} flights`);
      return flights;
    } catch (error) {
      console.warn('[Hybrid] FlightAware data unavailable:', error);
      return [];
    }
  }

  /**
   * Get ADS-B Exchange data with error handling
   */
  private async getAdsbData(): Promise<any[]> {
    try {
      const response = await adsbIntegratedFlightService.getEnhancedVirginAtlanticFlights();
      const flights = response.flights || [];
      console.log(`[Hybrid] ADS-B Exchange provided ${flights.length} flights`);
      return flights;
    } catch (error) {
      console.warn('[Hybrid] ADS-B data unavailable:', error);
      return [];
    }
  }

  /**
   * Merge FlightAware and ADS-B data intelligently
   */
  private mergeFlightData(flightAwareFlights: any[], adsbFlights: any[]): HybridFlightData[] {
    const merged: HybridFlightData[] = [];
    const processedCallsigns = new Set<string>();

    // Process ADS-B flights first (real-time position data)
    for (const adsbFlight of adsbFlights) {
      const callsign = adsbFlight.callsign || adsbFlight.flight_number;
      if (!callsign || processedCallsigns.has(callsign)) continue;

      // Look for matching FlightAware flight
      const matchingFaFlight = flightAwareFlights.find(fa => 
        fa.ident === callsign || 
        fa.ident.replace(/[^A-Z0-9]/g, '') === callsign.replace(/[^A-Z0-9]/g, '')
      );

      const hybridFlight: HybridFlightData = {
        callsign: callsign,
        flight_number: adsbFlight.flight_number || callsign,
        registration: adsbFlight.registration || matchingFaFlight?.registration,
        aircraft_type: adsbFlight.aircraft_type || matchingFaFlight?.aircraft_type || 'Unknown',
        
        // Route from FlightAware if available, otherwise ADS-B
        origin: matchingFaFlight?.origin || adsbFlight.origin || 'UNKNOWN',
        destination: matchingFaFlight?.destination || adsbFlight.destination || 'UNKNOWN',
        scheduled_departure: matchingFaFlight?.departure_time,
        scheduled_arrival: matchingFaFlight?.arrival_time,
        
        // Real-time position from ADS-B
        latitude: adsbFlight.latitude,
        longitude: adsbFlight.longitude,
        altitude: adsbFlight.altitude || 0,
        velocity: adsbFlight.velocity || 0,
        heading: adsbFlight.heading || 0,
        last_contact: adsbFlight.last_contact,
        
        // Status and progress
        status: matchingFaFlight?.status || adsbFlight.current_status || 'En Route',
        flight_progress: matchingFaFlight?.progress_percent || adsbFlight.flight_progress,
        distance_remaining: adsbFlight.distance_remaining,
        
        // Data sources
        data_sources: {
          position: 'ADS-B',
          schedule: matchingFaFlight ? 'FlightAware' : 'Fallback',
          route: matchingFaFlight ? 'FlightAware' : 'Fallback'
        },
        
        // Enhanced data from FlightAware
        waypoints: matchingFaFlight?.waypoints || [],
        
        // Quality assessment
        data_quality: {
          position_accuracy: adsbFlight.authentic_tracking ? 'HIGH' : 'MEDIUM',
          schedule_accuracy: matchingFaFlight ? 'HIGH' : 'LOW',
          last_updated: new Date().toISOString()
        }
      };

      merged.push(hybridFlight);
      processedCallsigns.add(callsign);
    }

    // Add FlightAware-only flights (scheduled but not yet airborne)
    for (const faFlight of flightAwareFlights) {
      if (!processedCallsigns.has(faFlight.ident)) {
        const hybridFlight: HybridFlightData = {
          callsign: faFlight.ident,
          flight_number: faFlight.ident,
          registration: faFlight.registration,
          aircraft_type: faFlight.aircraft_type || 'Unknown',
          
          origin: faFlight.origin,
          destination: faFlight.destination,
          scheduled_departure: faFlight.departure_time,
          scheduled_arrival: faFlight.arrival_time,
          
          // Use last known position from FlightAware if available
          latitude: faFlight.positions?.[faFlight.positions.length - 1]?.latitude || 0,
          longitude: faFlight.positions?.[faFlight.positions.length - 1]?.longitude || 0,
          altitude: faFlight.positions?.[faFlight.positions.length - 1]?.altitude || 0,
          velocity: faFlight.positions?.[faFlight.positions.length - 1]?.groundspeed || 0,
          heading: faFlight.positions?.[faFlight.positions.length - 1]?.track || 0,
          
          status: faFlight.status || 'Scheduled',
          flight_progress: faFlight.progress_percent,
          
          data_sources: {
            position: 'FlightAware',
            schedule: 'FlightAware',
            route: 'FlightAware'
          },
          
          waypoints: faFlight.waypoints || [],
          
          data_quality: {
            position_accuracy: faFlight.positions?.length > 0 ? 'MEDIUM' : 'LOW',
            schedule_accuracy: 'HIGH',
            last_updated: new Date().toISOString()
          }
        };

        merged.push(hybridFlight);
        processedCallsigns.add(faFlight.ident);
      }
    }

    return merged;
  }

  /**
   * Convert ADS-B data to hybrid format when FlightAware is unavailable
   */
  private convertAdsbToHybrid(adsbFlights: any[]): HybridFlightData[] {
    return adsbFlights.map(flight => ({
      callsign: flight.callsign || flight.flight_number,
      flight_number: flight.flight_number,
      registration: flight.registration,
      aircraft_type: flight.aircraft_type || 'Unknown',
      
      origin: flight.origin || 'UNKNOWN',
      destination: flight.destination || 'UNKNOWN',
      
      latitude: flight.latitude,
      longitude: flight.longitude,
      altitude: flight.altitude || 0,
      velocity: flight.velocity || 0,
      heading: flight.heading || 0,
      last_contact: flight.last_contact,
      
      status: flight.current_status || 'En Route',
      flight_progress: flight.flight_progress,
      distance_remaining: flight.distance_remaining,
      
      data_sources: {
        position: 'ADS-B',
        schedule: 'Fallback',
        route: 'Fallback'
      },
      
      data_quality: {
        position_accuracy: flight.authentic_tracking ? 'HIGH' : 'MEDIUM',
        schedule_accuracy: 'LOW',
        last_updated: new Date().toISOString()
      }
    }));
  }

  /**
   * Get detailed flight information combining both sources
   */
  async getFlightDetails(callsign: string): Promise<HybridFlightData | null> {
    try {
      // Get data from both sources
      const [faTrack, adsbFlight] = await Promise.all([
        flightAwareService.getFlightTrack(callsign),
        this.findAdsbFlight(callsign)
      ]);

      if (!faTrack && !adsbFlight) {
        return null;
      }

      // Merge the detailed data
      const hybridDetails: HybridFlightData = {
        callsign: callsign,
        flight_number: faTrack?.ident || adsbFlight?.flight_number || callsign,
        registration: faTrack?.registration || adsbFlight?.registration,
        aircraft_type: faTrack?.aircraft_type || adsbFlight?.aircraft_type || 'Unknown',
        
        origin: faTrack?.origin || adsbFlight?.origin || 'UNKNOWN',
        destination: faTrack?.destination || adsbFlight?.destination || 'UNKNOWN',
        scheduled_departure: faTrack?.departure_time,
        scheduled_arrival: faTrack?.arrival_time,
        
        latitude: adsbFlight?.latitude || faTrack?.positions?.[faTrack.positions.length - 1]?.latitude || 0,
        longitude: adsbFlight?.longitude || faTrack?.positions?.[faTrack.positions.length - 1]?.longitude || 0,
        altitude: adsbFlight?.altitude || faTrack?.positions?.[faTrack.positions.length - 1]?.altitude || 0,
        velocity: adsbFlight?.velocity || faTrack?.positions?.[faTrack.positions.length - 1]?.groundspeed || 0,
        heading: adsbFlight?.heading || faTrack?.positions?.[faTrack.positions.length - 1]?.track || 0,
        last_contact: adsbFlight?.last_contact,
        
        status: faTrack?.status || adsbFlight?.current_status || 'Unknown',
        flight_progress: faTrack?.progress_percent || adsbFlight?.flight_progress,
        
        data_sources: {
          position: adsbFlight ? 'ADS-B' : 'FlightAware',
          schedule: faTrack ? 'FlightAware' : 'Fallback',
          route: faTrack ? 'FlightAware' : 'Fallback'
        },
        
        waypoints: faTrack?.waypoints || [],
        
        data_quality: {
          position_accuracy: adsbFlight?.authentic_tracking ? 'HIGH' : 'MEDIUM',
          schedule_accuracy: faTrack ? 'HIGH' : 'LOW',
          last_updated: new Date().toISOString()
        }
      };

      return hybridDetails;
    } catch (error) {
      console.error(`[Hybrid] Failed to get flight details for ${callsign}:`, error);
      return null;
    }
  }

  /**
   * Find a specific flight in ADS-B data
   */
  private async findAdsbFlight(callsign: string): Promise<any | null> {
    try {
      const response = await adsbIntegratedFlightService.getEnhancedVirginAtlanticFlights();
      const flights = response.flights || [];
      
      return flights.find(flight => 
        flight.callsign === callsign || 
        flight.flight_number === callsign ||
        flight.callsign?.replace(/[^A-Z0-9]/g, '') === callsign.replace(/[^A-Z0-9]/g, '')
      ) || null;
    } catch (error) {
      console.warn('[Hybrid] Failed to find ADS-B flight:', error);
      return null;
    }
  }

  /**
   * Get service health status
   */
  async getServiceHealth(): Promise<any> {
    try {
      const [faHealth, adsbHealth] = await Promise.all([
        flightAwareService.healthCheck(),
        this.checkAdsbHealth()
      ]);

      return {
        hybrid_service: 'operational',
        data_sources: {
          flightaware: faHealth,
          adsb_exchange: adsbHealth
        },
        integration_status: 'active',
        last_check: new Date().toISOString()
      };
    } catch (error) {
      return {
        hybrid_service: 'error',
        error: error.message,
        last_check: new Date().toISOString()
      };
    }
  }

  /**
   * Check ADS-B service health
   */
  private async checkAdsbHealth(): Promise<any> {
    try {
      const response = await adsbIntegratedFlightService.getEnhancedVirginAtlanticFlights();
      return {
        status: 'ok',
        message: 'ADS-B Exchange connection successful',
        authenticated: true,
        flight_count: response.flights?.length || 0
      };
    } catch (error) {
      return {
        status: 'error',
        message: `ADS-B connection failed: ${error}`,
        authenticated: false
      };
    }
  }
}

export const hybridFlightService = new HybridFlightService();
export type { HybridFlightData };