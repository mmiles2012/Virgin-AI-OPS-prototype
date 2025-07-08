import { openSkyTracker } from './openSkyFlightTracker';

interface RealFlightUpdate {
  callsign: string;
  icao24: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  aircraft_type: string;
  airline: string;
  is_real_data: boolean;
  data_source: string;
  last_updated: string;
}

export class RealFlightIntegrationService {
  private realFlightCache: Map<string, RealFlightUpdate> = new Map();
  private lastUpdate: number = 0;
  private readonly UPDATE_INTERVAL = 30000; // 30 seconds

  /**
   * Get real flight data and merge with existing Virgin Atlantic tracking
   */
  async getRealFlightData(): Promise<RealFlightUpdate[]> {
    // Check if we need to refresh data
    if (Date.now() - this.lastUpdate < this.UPDATE_INTERVAL && this.realFlightCache.size > 0) {
      return Array.from(this.realFlightCache.values());
    }

    try {
      console.log('Fetching fresh real flight data from OpenSky...');
      
      // Get real Virgin Atlantic flights
      const virginFlights = await openSkyTracker.getVirginAtlanticFlights();
      
      // Get general UK area flights for context
      const ukFlights = await openSkyTracker.getFlightsInBoundingBox(
        50.0, 60.0, // UK latitude range
        -10.0, 2.0  // UK longitude range
      );

      // Process and cache the data
      const allFlights = [...virginFlights, ...ukFlights];
      this.realFlightCache.clear();

      const processedFlights = allFlights.map(flight => ({
        callsign: flight.callsign,
        icao24: flight.icao24,
        latitude: flight.latitude,
        longitude: flight.longitude,
        altitude: flight.altitude,
        velocity: flight.velocity,
        heading: flight.heading,
        aircraft_type: flight.aircraft_type || 'Unknown',
        airline: flight.airline || 'Unknown',
        is_real_data: true,
        data_source: 'OpenSky Network',
        last_updated: new Date().toISOString()
      }));

      // Cache the results
      processedFlights.forEach(flight => {
        this.realFlightCache.set(flight.icao24, flight);
      });

      this.lastUpdate = Date.now();
      
      console.log(`Real flight integration: Cached ${processedFlights.length} real flights`);
      return processedFlights;

    } catch (error) {
      console.error('Error fetching real flight data:', error);
      // Return cached data if available
      return Array.from(this.realFlightCache.values());
    }
  }

  /**
   * Replace simulated Virgin Atlantic flights with real data where available
   */
  async enhanceVirginAtlanticFlights(simulatedFlights: any[]): Promise<any[]> {
    const realFlights = await this.getRealFlightData();
    
    // Find real Virgin Atlantic flights
    const realVirginFlights = realFlights.filter(flight => 
      flight.airline === 'Virgin Atlantic' || 
      flight.callsign.startsWith('VIR') || 
      flight.callsign.startsWith('VS')
    );

    console.log(`Found ${realVirginFlights.length} real Virgin Atlantic flights to replace simulated data`);

    // Replace simulated flights with real ones where possible
    let enhancedFlights = [...simulatedFlights];
    
    realVirginFlights.forEach((realFlight, index) => {
      if (index < enhancedFlights.length) {
        // Replace simulated flight with real data
        enhancedFlights[index] = {
          ...enhancedFlights[index],
          // Update with real position data
          latitude: realFlight.latitude,
          longitude: realFlight.longitude,
          altitude: realFlight.altitude,
          velocity: realFlight.velocity,
          heading: realFlight.heading,
          // Mark as real data
          is_real_tracking: true,
          real_data_source: realFlight.data_source,
          icao24: realFlight.icao24,
          callsign: realFlight.callsign,
          // Keep existing flight details but update status
          current_status: 'EN_ROUTE_REAL',
          warnings: [] // Clear simulated warnings
        };
      }
    });

    return enhancedFlights;
  }

  /**
   * Get real flight statistics
   */
  getRealFlightStats(): {
    total_real_flights: number;
    virgin_atlantic_real: number;
    last_update: string;
    data_freshness: string;
  } {
    const realFlights = Array.from(this.realFlightCache.values());
    const virginFlights = realFlights.filter(flight => 
      flight.airline === 'Virgin Atlantic' || 
      flight.callsign.startsWith('VIR') || 
      flight.callsign.startsWith('VS')
    );

    const minutesSinceUpdate = Math.floor((Date.now() - this.lastUpdate) / 60000);
    
    return {
      total_real_flights: realFlights.length,
      virgin_atlantic_real: virginFlights.length,
      last_update: new Date(this.lastUpdate).toISOString(),
      data_freshness: `${minutesSinceUpdate} minutes ago`
    };
  }
}

export const realFlightIntegration = new RealFlightIntegrationService();