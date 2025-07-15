import { virginAtlanticService as originalService } from './virginAtlanticService';

interface RealFlightData {
  callsign: string;
  icao24: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  aircraft_type?: string;
  airline?: string;
  on_ground: boolean;
  last_contact: string;
}

class VirginAtlanticServiceEnhanced {
  private lastRealFlightCheck = 0;
  private realFlightCache: any[] = [];
  private readonly CACHE_DURATION = 30000; // 30 seconds

  public async getFlights(): Promise<{ flights: any[], total_flights: number, source: string }> {
    // Check for real flights first
    const realFlights = await this.getRealVirginAtlanticFlights();
    
    if (realFlights.length > 0) {
      console.log(`Enhanced Service: Using ${realFlights.length} authentic Virgin Atlantic flights`);
      return {
        flights: realFlights,
        total_flights: realFlights.length,
        source: 'OpenSky Network - Real Flight Tracking'
      };
    }
    
    // Fallback to original service
    console.log('Enhanced Service: No real flights found, using simulation');
    return await originalService.getFlights();
  }

  private async getRealVirginAtlanticFlights(): Promise<any[]> {
    const now = Date.now();
    
    // Use cache if recent
    if (now - this.lastRealFlightCheck < this.CACHE_DURATION && this.realFlightCache.length > 0) {
      return this.realFlightCache;
    }

    try {
      const response = await fetch('http://localhost:5000/api/flights/real-tracking');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const realData = await response.json();
      if (!realData.success || !realData.flights) {
        return [];
      }

      // Filter for Virgin Atlantic flights
      const virginFlights = realData.flights.filter((flight: RealFlightData) => 
        flight.callsign && (
          flight.callsign.includes('VIR') || 
          flight.callsign.includes('VS') ||
          (flight.airline && flight.airline.includes('Virgin'))
        )
      );

      if (virginFlights.length === 0) {
        return [];
      }

      // Convert real flights to our format
      const enhancedFlights = virginFlights.map((realFlight: RealFlightData, index: number) => {
        const [depAirport, arrAirport] = this.guessRoute(realFlight.latitude, realFlight.longitude);
        const currentTime = new Date();
        
        return {
          flight_number: realFlight.callsign,
          airline: 'Virgin Atlantic',
          aircraft_type: realFlight.aircraft_type || 'Boeing 787-9',
          route: `${depAirport}-${arrAirport}`,
          departure_airport: depAirport,
          arrival_airport: arrAirport,
          departure_time: new Date(currentTime.getTime() - 2 * 60 * 60 * 1000).toTimeString().slice(0, 5),
          arrival_time: new Date(currentTime.getTime() + 6 * 60 * 60 * 1000).toTimeString().slice(0, 5),
          frequency: 'Real-time',
          status: realFlight.on_ground ? 'On Ground' : 'En Route (Real)',
          gate: `T3-${Math.floor(Math.random() * 59) + 1}`,
          terminal: '3',
          callsign: realFlight.callsign,
          latitude: realFlight.latitude,
          longitude: realFlight.longitude,
          altitude: realFlight.altitude || 35000,
          velocity: realFlight.velocity || 485,
          heading: realFlight.heading || 270,
          aircraft: realFlight.aircraft_type || 'Boeing 787-9',
          origin: depAirport,
          destination: arrAirport,
          scheduled_departure: new Date(currentTime.getTime() - 2 * 60 * 60 * 1000).toISOString(),
          scheduled_arrival: new Date(currentTime.getTime() + 6 * 60 * 60 * 1000).toISOString(),
          current_status: realFlight.on_ground ? 'ON_GROUND_REAL' : 'EN_ROUTE_REAL',
          flight_progress: this.calculateProgress(realFlight.latitude, realFlight.longitude, depAirport, arrAirport),
          distance_remaining: Math.floor(Math.random() * 2000) + 1000,
          delay_minutes: 0,
          fuel_remaining: Math.floor(Math.random() * 40) + 60,
          warnings: [], // Real flights don't have artificial warnings
          is_real_tracking: true,
          real_data_source: 'OpenSky Network',
          icao24: realFlight.icao24,
          last_contact: realFlight.last_contact,
          digital_twin_data: {
            performance_calculations: {
              total_flight_time_hours: 6.0,
              fuel_efficiency_kg_per_hour: 1500,
              operational_cost_usd: 40000,
              cost_per_passenger_usd: 150,
              engine_thrust_percentage: 95,
              fuel_flow_kg_per_hour: 800
            }
          }
        };
      });

      // Update cache
      this.realFlightCache = enhancedFlights;
      this.lastRealFlightCheck = now;

      return enhancedFlights;
    } catch (error) {
      console.log(`Enhanced Service: Real flight fetch failed: ${error}`);
      return [];
    }
  }

  private guessRoute(lat: number, lng: number): [string, string] {
    // Simple route guessing based on position
    const airports = {
      'LHR': { lat: 51.4700, lng: -0.4543 },
      'JFK': { lat: 40.6413, lng: -73.7781 },
      'BOS': { lat: 42.3656, lng: -71.0096 },
      'LAX': { lat: 33.9425, lng: -118.4081 },
      'MIA': { lat: 25.7943, lng: -80.2906 },
      'ICN': { lat: 37.4602, lng: 126.4407 },
      'NRT': { lat: 35.7720, lng: 140.3929 },
      'BOM': { lat: 19.0896, lng: 72.8656 },
      'DEL': { lat: 28.5562, lng: 77.1000 }
    };

    // Find closest airports
    let minDist1 = Infinity, minDist2 = Infinity;
    let closest1 = 'LHR', closest2 = 'JFK';

    Object.entries(airports).forEach(([code, coords]) => {
      const dist = Math.sqrt(Math.pow(lat - coords.lat, 2) + Math.pow(lng - coords.lng, 2));
      if (dist < minDist1) {
        minDist2 = minDist1;
        closest2 = closest1;
        minDist1 = dist;
        closest1 = code;
      } else if (dist < minDist2) {
        minDist2 = dist;
        closest2 = code;
      }
    });

    // Atlantic flight logic
    if (lng < -30) {
      return ['LHR', closest1 === 'LHR' ? closest2 : closest1];
    } else if (lng > 60) {
      return ['LHR', closest1 === 'LHR' ? closest2 : closest1];
    } else {
      return [closest1, closest2];
    }
  }

  private calculateProgress(lat: number, lng: number, depAirport: string, arrAirport: string): number {
    // Simple progress calculation
    const airports = {
      'LHR': { lat: 51.4700, lng: -0.4543 },
      'JFK': { lat: 40.6413, lng: -73.7781 },
      'BOS': { lat: 42.3656, lng: -71.0096 },
      'LAX': { lat: 33.9425, lng: -118.4081 },
      'MIA': { lat: 25.7943, lng: -80.2906 },
      'ICN': { lat: 37.4602, lng: 126.4407 }
    };

    const dep = airports[depAirport as keyof typeof airports] || airports.LHR;
    const arr = airports[arrAirport as keyof typeof airports] || airports.JFK;

    const totalDist = Math.sqrt(Math.pow(arr.lat - dep.lat, 2) + Math.pow(arr.lng - dep.lng, 2));
    const currentDist = Math.sqrt(Math.pow(lat - dep.lat, 2) + Math.pow(lng - dep.lng, 2));

    return Math.min(100, Math.max(0, (currentDist / totalDist) * 100));
  }
}

export const virginAtlanticServiceEnhanced = new VirginAtlanticServiceEnhanced();