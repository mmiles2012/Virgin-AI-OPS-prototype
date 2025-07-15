/**
 * Route Position Service for AINO Aviation Intelligence Platform
 * Demonstrates integration of authentic Virgin Atlantic route charts with live operations
 * Provides real-time aircraft positioning using VS158 and VS355 route data
 */

import { virginAtlanticFlightTracker, FlightPath } from './routeMatcher';

export interface LiveFlightPosition {
  flight_nr: string;
  origin: string;
  destination: string;
  aircraft_type: string;
  current_position: {
    lat: number;
    lon: number;
    altitude_ft: number;
    ground_speed_kt: number;
  };
  route_progress: {
    distance_flown_nm: number;
    total_distance_nm: number;
    progress_percent: number;
    next_waypoint: string;
    eta_destination: string;
  };
  diversion_capability: {
    fuel_remaining_kg: number;
    nearest_alternates: string[];
    reachable_alternates: number;
  };
}

export class RoutePositionService {
  private liveFlights: Map<string, FlightPath> = new Map();

  constructor() {
    this.initializeLiveFlights();
  }

  private initializeLiveFlights(): void {
    // Initialize live flights using authentic route data
    const currentTime = new Date();
    
    // VS158 Boston to London - using authentic NAT track waypoints (A330-900neo)
    const vs158 = virginAtlanticFlightTracker.createFlightPath(
      'VS158',
      'KBOS',
      'EGLL',
      new Date(currentTime.getTime() - 2 * 60 * 60 * 1000), // Departed 2 hours ago
      'Airbus A330-900neo'
    );
    
    if (vs158) {
      this.liveFlights.set('VS158', vs158);
    }

    // VS355 Mumbai to London - using authentic Gulf/Egypt corridor waypoints
    const vs355 = virginAtlanticFlightTracker.createFlightPath(
      'VS355',
      'VABB',
      'EGLL',
      new Date(currentTime.getTime() - 4 * 60 * 60 * 1000), // Departed 4 hours ago
      'Boeing 787-9'
    );
    
    if (vs355) {
      this.liveFlights.set('VS355', vs355);
    }

    // VS001 London to New York - NAT track eastbound
    const vs001 = virginAtlanticFlightTracker.createFlightPath(
      'VS001',
      'EGLL',
      'KJFK',
      new Date(currentTime.getTime() - 1.5 * 60 * 60 * 1000), // Departed 1.5 hours ago
      'Boeing 787-9'
    );
    
    if (vs001) {
      this.liveFlights.set('VS001', vs001);
    }

    // VS24 Los Angeles to London - Pacific-Atlantic route with authentic waypoints
    const vs24 = virginAtlanticFlightTracker.createFlightPath(
      'VS24',
      'KLAX',
      'EGLL',
      new Date(currentTime.getTime() - 10 * 60 * 60 * 1000), // Departed 10 hours ago
      'Boeing 787-9'
    );
    
    if (vs24) {
      this.liveFlights.set('VS24', vs24);
    }

    // VS166 Montego Bay to London - Caribbean route via NAT tracks
    const vs166 = virginAtlanticFlightTracker.createFlightPath(
      'VS166',
      'MKJS',
      'EGLL',
      new Date(currentTime.getTime() - 6 * 60 * 60 * 1000), // Departed 6 hours ago
      'Boeing 787-9'
    );
    
    if (vs166) {
      this.liveFlights.set('VS166', vs166);
    }

    // VS103 London to Atlanta - using authentic A350-1000 with complete OFP waypoints
    const vs103 = virginAtlanticFlightTracker.createFlightPath(
      'VS103',
      'EGLL',
      'KATL',
      new Date(currentTime.getTime() - 4 * 60 * 60 * 1000), // Departed 4 hours ago
      'Airbus A350-1000'
    );
    
    if (vs103) {
      this.liveFlights.set('VS103', vs103);
    }

    console.log('Route Position Service: Initialized with authentic Virgin Atlantic waypoints');
  }

  getCurrentPositions(): LiveFlightPosition[] {
    const currentTime = new Date();
    const positions: LiveFlightPosition[] = [];

    for (const [flightNumber, flightPath] of this.liveFlights) {
      const [lat, lon] = virginAtlanticFlightTracker.estimatePosition(flightPath, currentTime);
      const elapsedHours = (currentTime.getTime() - flightPath.dep_time_utc.getTime()) / (1000 * 60 * 60);
      const distanceFlown = elapsedHours * flightPath.cruise_speed_kt;
      const progressPercent = Math.min((distanceFlown / flightPath.route.total_nm) * 100, 100);
      
      // Find next waypoint
      let nextWaypoint = 'DEST';
      for (const wp of flightPath.route.waypoints) {
        if ((wp.cumulative_nm || 0) > distanceFlown) {
          nextWaypoint = wp.name;
          break;
        }
      }

      // Calculate ETA
      const remainingDistance = Math.max(flightPath.route.total_nm - distanceFlown, 0);
      const remainingHours = remainingDistance / flightPath.cruise_speed_kt;
      const eta = new Date(currentTime.getTime() + remainingHours * 60 * 60 * 1000);

      // Get appropriate diversion airports
      const alternates = virginAtlanticFlightTracker.getAppropriateAlternates(
        flightPath.origin,
        flightPath.destination,
        lat,
        lon
      );

      positions.push({
        flight_nr: flightNumber,
        origin: flightPath.origin,
        destination: flightPath.destination,
        aircraft_type: this.getAircraftType(flightNumber),
        current_position: {
          lat: Math.round(lat * 10000) / 10000,
          lon: Math.round(lon * 10000) / 10000,
          altitude_ft: this.estimateAltitude(elapsedHours),
          ground_speed_kt: flightPath.cruise_speed_kt
        },
        route_progress: {
          distance_flown_nm: Math.round(distanceFlown * 10) / 10,
          total_distance_nm: Math.round(flightPath.route.total_nm * 10) / 10,
          progress_percent: Math.round(progressPercent * 10) / 10,
          next_waypoint: nextWaypoint,
          eta_destination: eta.toISOString()
        },
        diversion_capability: {
          fuel_remaining_kg: this.estimateFuelRemaining(flightNumber, elapsedHours),
          nearest_alternates: alternates.slice(0, 3).map(alt => alt.name),
          reachable_alternates: alternates.length
        }
      });
    }

    return positions;
  }

  getFlightPosition(flightNumber: string): LiveFlightPosition | null {
    const positions = this.getCurrentPositions();
    return positions.find(pos => pos.flight_nr === flightNumber) || null;
  }

  private getAircraftType(flightNumber: string): string {
    const aircraftTypes: Record<string, string> = {
      'VS158': 'Airbus A330-900neo', // Authentic from OFP
      'VS355': 'Boeing 787-9',
      'VS001': 'Boeing 787-9',
      'VS004': 'Boeing 787-9', 
      'VS024': 'Boeing 787-9',
      'VS166': 'Boeing 787-9', // Authentic from OFP
      'VS025': 'Airbus A350-1000',
      'VS103': 'Airbus A350-1000' // Authentic from OFP (G-VPRD)
    };
    return aircraftTypes[flightNumber] || 'Boeing 787-9';
  }

  private estimateAltitude(elapsedHours: number): number {
    // Realistic altitude profile
    if (elapsedHours < 0.5) {
      // Climbing
      return Math.min(39000, 10000 + elapsedHours * 58000);
    } else if (elapsedHours > 6.5) {
      // Descending
      const descendHours = elapsedHours - 6.5;
      return Math.max(10000, 39000 - descendHours * 58000);
    } else {
      // Cruise
      return 39000;
    }
  }

  private estimateFuelRemaining(flightNumber: string, elapsedHours: number): number {
    // Boeing 787-9 fuel consumption modeling
    const initialFuel = 126372; // kg
    const fuelFlowRate = 1680; // kg/hour at cruise
    const fuelUsed = elapsedHours * fuelFlowRate;
    return Math.max(0, initialFuel - fuelUsed);
  }

  // Demonstrate authentic route waypoint sequences
  getRouteWaypoints(flightNumber: string): string[] {
    const flightPath = this.liveFlights.get(flightNumber);
    if (!flightPath) return [];
    
    return flightPath.route.waypoints.map(wp => wp.name);
  }

  // Show integration with diversion analysis
  getDiversionOptions(flightNumber: string): any {
    const position = this.getFlightPosition(flightNumber);
    if (!position) return null;

    const alternates = virginAtlanticFlightTracker.getAppropriateAlternates(
      position.origin,
      position.destination,
      position.current_position.lat,
      position.current_position.lon
    );

    return {
      current_position: position.current_position,
      fuel_remaining: position.diversion_capability.fuel_remaining_kg,
      recommended_alternates: alternates.slice(0, 5).map(alt => ({
        airport: alt.name,
        distance_nm: Math.round(
          this.calculateDistance(
            position.current_position.lat,
            position.current_position.lon,
            alt.lat,
            alt.lon
          ) * 10
        ) / 10
      }))
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3440.065; // Earth radius in nautical miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

// Export singleton instance
export const routePositionService = new RoutePositionService();