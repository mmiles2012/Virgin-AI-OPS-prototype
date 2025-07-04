/**
 * Route Matcher for AINO Aviation Intelligence Platform
 * Provides accurate flight path positioning for the entire Virgin Atlantic network
 * Integrated with enhanced diversion analysis for geographic accuracy
 */

import { getRouteAppropriateAirports } from './diversionOptimizer';

const EARTH_RADIUS_NM = 3440.065;
const DEG2RAD = Math.PI / 180.0;
const RAD2DEG = 180.0 / Math.PI;

export interface Waypoint {
  name: string;
  lat: number;
  lon: number;
  cumulative_nm?: number;
}

export interface RoutePlan {
  origin: string;
  destination: string;
  waypoints: Waypoint[];
  total_nm: number;
}

export interface FlightPath {
  flight_nr: string;
  origin: string;
  destination: string;
  dep_time_utc: Date;
  cruise_speed_kt: number;
  route: RoutePlan;
}

// Haversine distance calculation
export function haversineNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const [rlat1, rlon1, rlat2, rlon2] = [lat1, lon1, lat2, lon2].map(x => x * DEG2RAD);
  const dlat = rlat2 - rlat1;
  const dlon = rlon2 - rlon1;
  const a = Math.sin(dlat / 2) ** 2 + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(dlon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_NM * c;
}

// Great circle interpolation
export function interpolateGreatCircle(
  lat1: number, lon1: number, lat2: number, lon2: number, f: number
): [number, number] {
  const [rlat1, rlon1, rlat2, rlon2] = [lat1, lon1, lat2, lon2].map(x => x * DEG2RAD);
  const d = haversineNm(lat1, lon1, lat2, lon2) / EARTH_RADIUS_NM;
  
  if (d === 0) return [lat1, lon1];

  const a = Math.sin((1 - f) * d) / Math.sin(d);
  const b = Math.sin(f * d) / Math.sin(d);
  const x = a * Math.cos(rlat1) * Math.cos(rlon1) + b * Math.cos(rlat2) * Math.cos(rlon2);
  const y = a * Math.cos(rlat1) * Math.sin(rlon1) + b * Math.cos(rlat2) * Math.sin(rlon2);
  const z = a * Math.sin(rlat1) + b * Math.sin(rlat2);
  const lat = Math.atan2(z, Math.sqrt(x ** 2 + y ** 2));
  const lon = Math.atan2(y, x);
  return [lat * RAD2DEG, lon * RAD2DEG];
}

// Virgin Atlantic route library with authentic waypoints
export class VirginAtlanticRouteLibrary {
  private routes: Map<string, RoutePlan> = new Map();

  constructor() {
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // North Atlantic routes - accurate NAT track waypoints
    this.addRoute('EGLL', 'KJFK', [
      { name: 'EGLL', lat: 51.4706, lon: -0.4619 },
      { name: 'DOGAL', lat: 53.6483, lon: -7.6917 },
      { name: 'SOMAX', lat: 55.7533, lon: -15.0 },
      { name: '55N020W', lat: 55.0, lon: -20.0 },
      { name: '52N040W', lat: 52.0, lon: -40.0 },
      { name: 'NORMY', lat: 45.07, lon: -60.0 },
      { name: 'KESNO', lat: 44.505, lon: -70.0 },
      { name: 'CAM', lat: 43.892, lon: -73.527 },
      { name: 'KJFK', lat: 40.6413, lon: -73.7781 }
    ]);

    this.addRoute('EGLL', 'KBOS', [
      { name: 'EGLL', lat: 51.4706, lon: -0.4619 },
      { name: 'DOGAL', lat: 53.6483, lon: -7.6917 },
      { name: 'SOMAX', lat: 55.7533, lon: -15.0 },
      { name: '55N020W', lat: 55.0, lon: -20.0 },
      { name: '50N040W', lat: 50.0, lon: -40.0 },
      { name: 'OYSTR', lat: 44.55, lon: -60.0 },
      { name: 'KBOS', lat: 42.3656, lon: -71.0096 }
    ]);

    // India routes - authentic routing via Middle East
    this.addRoute('EGLL', 'VABB', [
      { name: 'EGLL', lat: 51.4706, lon: -0.4619 },
      { name: 'LAMSO', lat: 49.25, lon: 2.0 },
      { name: 'NARAK', lat: 46.5833, lon: 7.5 },
      { name: 'RUDOL', lat: 44.5, lon: 15.0 },
      { name: 'BERUX', lat: 36.0, lon: 24.0 },
      { name: 'OMDB', lat: 25.2532, lon: 55.3657 },
      { name: 'PARAR', lat: 24.0, lon: 62.0 },
      { name: 'BOBAX', lat: 22.0, lon: 68.0 },
      { name: 'VABB', lat: 19.0896, lon: 72.8656 }
    ]);

    this.addRoute('EGLL', 'VIDP', [
      { name: 'EGLL', lat: 51.4706, lon: -0.4619 },
      { name: 'LAMSO', lat: 49.25, lon: 2.0 },
      { name: 'NARAK', lat: 46.5833, lon: 7.5 },
      { name: 'RUDOL', lat: 44.5, lon: 15.0 },
      { name: 'BERUX', lat: 36.0, lon: 24.0 },
      { name: 'OMDB', lat: 25.2532, lon: 55.3657 },
      { name: 'PARAR', lat: 24.0, lon: 62.0 },
      { name: 'KODEL', lat: 26.0, lon: 72.0 },
      { name: 'VIDP', lat: 28.5665, lon: 77.1031 }
    ]);

    // Asia-Pacific routes
    this.addRoute('EGLL', 'VHHH', [
      { name: 'EGLL', lat: 51.4706, lon: -0.4619 },
      { name: 'RUDOL', lat: 44.5, lon: 15.0 },
      { name: 'BERUX', lat: 36.0, lon: 24.0 },
      { name: 'OMDB', lat: 25.2532, lon: 55.3657 },
      { name: 'PARAR', lat: 24.0, lon: 62.0 },
      { name: 'BOBAX', lat: 22.0, lon: 68.0 },
      { name: 'NIXAX', lat: 20.0, lon: 85.0 },
      { name: 'VHHH', lat: 22.3080, lon: 113.9185 }
    ]);

    this.addRoute('EGLL', 'YSSY', [
      { name: 'EGLL', lat: 51.4706, lon: -0.4619 },
      { name: 'RUDOL', lat: 44.5, lon: 15.0 },
      { name: 'BERUX', lat: 36.0, lon: 24.0 },
      { name: 'OMDB', lat: 25.2532, lon: 55.3657 },
      { name: 'BOBAX', lat: 22.0, lon: 68.0 },
      { name: 'NIXAX', lat: 20.0, lon: 85.0 },
      { name: 'VHHH', lat: 22.3080, lon: 113.9185 },
      { name: 'YSSY', lat: -33.9399, lon: 151.1753 }
    ]);

    // South America routes
    this.addRoute('EGLL', 'SBGR', [
      { name: 'EGLL', lat: 51.4706, lon: -0.4619 },
      { name: 'LAMSO', lat: 49.25, lon: 2.0 },
      { name: 'LEMD', lat: 40.4719, lon: -3.5626 },
      { name: 'GCFV', lat: 27.9318, lon: -15.3866 },
      { name: 'GVAC', lat: 14.9455, lon: -23.4839 },
      { name: 'ASCN', lat: -7.9697, lon: -14.3935 },
      { name: 'RECIF', lat: -8.1267, lon: -34.9236 },
      { name: 'SBGR', lat: -23.4356, lon: -46.4731 }
    ]);

    // Add reverse routes automatically
    this.generateReverseRoutes();
  }

  private addRoute(origin: string, destination: string, waypoints: Waypoint[]): void {
    const route = this.createRoutePlan(origin, destination, waypoints);
    this.routes.set(`${origin}-${destination}`, route);
  }

  public createRoutePlan(origin: string, destination: string, waypoints: Waypoint[]): RoutePlan {
    let totalDistance = 0;
    for (let i = 0; i < waypoints.length; i++) {
      if (i > 0) {
        const prev = waypoints[i - 1];
        const curr = waypoints[i];
        const segmentDistance = haversineNm(prev.lat, prev.lon, curr.lat, curr.lon);
        totalDistance += segmentDistance;
      }
      waypoints[i].cumulative_nm = totalDistance;
    }

    return {
      origin,
      destination,
      waypoints,
      total_nm: totalDistance
    };
  }

  private generateReverseRoutes(): void {
    const originalRoutes = Array.from(this.routes.entries());
    for (const [key, route] of originalRoutes) {
      const [origin, destination] = key.split('-');
      const reverseKey = `${destination}-${origin}`;
      
      if (!this.routes.has(reverseKey)) {
        const reverseWaypoints = [...route.waypoints].reverse().map(wp => ({
          ...wp,
          cumulative_nm: 0 // Will be recalculated
        }));
        this.addRoute(destination, origin, reverseWaypoints);
      }
    }
  }

  getRoute(origin: string, destination: string): RoutePlan | null {
    return this.routes.get(`${origin}-${destination}`) || null;
  }

  getAllRoutes(): RoutePlan[] {
    return Array.from(this.routes.values());
  }
}

// Flight position estimator
export class FlightPositionEstimator {
  private routeLibrary: VirginAtlanticRouteLibrary;

  constructor() {
    this.routeLibrary = new VirginAtlanticRouteLibrary();
  }

  estimatePosition(flight: FlightPath, currentTime: Date): [number, number] {
    const elapsedHours = Math.max((currentTime.getTime() - flight.dep_time_utc.getTime()) / (1000 * 60 * 60), 0);
    const distanceFlown = elapsedHours * flight.cruise_speed_kt;

    if (distanceFlown >= flight.route.total_nm) {
      // Flight has arrived
      const lastWaypoint = flight.route.waypoints[flight.route.waypoints.length - 1];
      return [lastWaypoint.lat, lastWaypoint.lon];
    }

    // Find the segment containing the current position
    for (let i = 1; i < flight.route.waypoints.length; i++) {
      const segmentEnd = flight.route.waypoints[i].cumulative_nm || 0;
      if (distanceFlown <= segmentEnd) {
        const segmentStart = flight.route.waypoints[i - 1].cumulative_nm || 0;
        const segmentFraction = (distanceFlown - segmentStart) / (segmentEnd - segmentStart);
        
        const startWp = flight.route.waypoints[i - 1];
        const endWp = flight.route.waypoints[i];
        
        return interpolateGreatCircle(startWp.lat, startWp.lon, endWp.lat, endWp.lon, segmentFraction);
      }
    }

    // Fallback to destination
    const lastWaypoint = flight.route.waypoints[flight.route.waypoints.length - 1];
    return [lastWaypoint.lat, lastWaypoint.lon];
  }

  createFlightPath(
    flightNumber: string,
    origin: string,
    destination: string,
    departureTime: Date,
    aircraftType: string = 'Boeing 787-9'
  ): FlightPath | null {
    const route = this.routeLibrary.getRoute(origin, destination);
    if (!route) {
      // Create great circle fallback
      const greatCircleRoute = this.createGreatCircleRoute(origin, destination);
      if (!greatCircleRoute) return null;
      
      return {
        flight_nr: flightNumber,
        origin,
        destination,
        dep_time_utc: departureTime,
        cruise_speed_kt: this.getCruiseSpeed(aircraftType),
        route: greatCircleRoute
      };
    }

    return {
      flight_nr: flightNumber,
      origin,
      destination,
      dep_time_utc: departureTime,
      cruise_speed_kt: this.getCruiseSpeed(aircraftType),
      route
    };
  }

  private createGreatCircleRoute(origin: string, destination: string): RoutePlan | null {
    const airports = this.getAirportCoordinates();
    const originCoords = airports[origin];
    const destCoords = airports[destination];

    if (!originCoords || !destCoords) return null;

    const waypoints: Waypoint[] = [
      { name: origin, lat: originCoords.lat, lon: originCoords.lon },
      { name: destination, lat: destCoords.lat, lon: destCoords.lon }
    ];

    return this.routeLibrary.createRoutePlan(origin, destination, waypoints);
  }

  private getCruiseSpeed(aircraftType: string): number {
    const speeds: Record<string, number> = {
      'Boeing 787-9': 485,
      'Airbus A350-1000': 488,
      'Airbus A330-300': 475,
      'Airbus A330-900': 480
    };
    return speeds[aircraftType] || 480;
  }

  private getAirportCoordinates(): Record<string, { lat: number; lon: number }> {
    return {
      'EGLL': { lat: 51.4706, lon: -0.4619 },
      'EGKK': { lat: 51.1481, lon: -0.1903 },
      'EGCC': { lat: 53.3547, lon: -2.2750 },
      'KJFK': { lat: 40.6413, lon: -73.7781 },
      'KBOS': { lat: 42.3656, lon: -71.0096 },
      'KLAX': { lat: 33.9425, lon: -118.4081 },
      'KORD': { lat: 41.9742, lon: -87.9073 },
      'VABB': { lat: 19.0896, lon: 72.8656 },
      'VIDP': { lat: 28.5665, lon: 77.1031 },
      'VOBL': { lat: 13.1986, lon: 77.7066 },
      'VHHH': { lat: 22.3080, lon: 113.9185 },
      'YSSY': { lat: -33.9399, lon: 151.1753 },
      'YMML': { lat: -37.6690, lon: 144.8410 },
      'SBGR': { lat: -23.4356, lon: -46.4731 },
      'SAEZ': { lat: -34.8222, lon: -58.5358 },
      'OMDB': { lat: 25.2532, lon: 55.3657 }
    };
  }

  // Integration with diversion analysis
  getAppropriateAlternates(
    origin: string,
    destination: string,
    currentLat: number,
    currentLon: number
  ): any[] {
    return getRouteAppropriateAirports(origin, destination, currentLat, currentLon);
  }
}

// Export singleton instance
export const virginAtlanticFlightTracker = new FlightPositionEstimator();