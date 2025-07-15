import { virginAtlanticService } from './virginAtlanticService';

interface AircraftPosition {
  callsign: string;
  flight_number: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  aircraft_type: string;
  origin: string;
  destination: string;
  route: string;
  flight_progress: number;
  distance_remaining: number;
  current_status: string;
  fuel_remaining: number;
  warnings: string[];
  last_updated: string;
}

class AircraftTrackingService {
  private trackingInterval: NodeJS.Timeout | null = null;
  private aircraftPositions: Map<string, AircraftPosition> = new Map();

  constructor() {
    this.startTracking();
  }

  private startTracking(): void {
    // Update aircraft positions every 30 seconds
    this.trackingInterval = setInterval(() => {
      this.updateAircraftPositions();
    }, 30000);

    // Initial update
    this.updateAircraftPositions();
    console.log('Aircraft tracking service started - updating positions every 30 seconds');
  }

  private updateAircraftPositions(): void {
    try {
      const operationalData = virginAtlanticService.generateOperationalData();
      
      operationalData.forEach((flight: any) => {
        const position: AircraftPosition = {
          callsign: flight.callsign,
          flight_number: flight.flight_number,
          latitude: flight.latitude,
          longitude: flight.longitude,
          altitude: flight.altitude,
          velocity: flight.velocity,
          heading: flight.heading,
          aircraft_type: flight.aircraft_type,
          origin: flight.origin,
          destination: flight.destination,
          route: flight.route,
          flight_progress: flight.flight_progress,
          distance_remaining: flight.distance_remaining,
          current_status: flight.current_status,
          fuel_remaining: flight.fuel_remaining,
          warnings: flight.warnings,
          last_updated: new Date().toISOString()
        };

        this.aircraftPositions.set(flight.flight_number, position);
      });

      console.log(`Updated positions for ${this.aircraftPositions.size} Virgin Atlantic aircraft`);
    } catch (error) {
      console.error('Error updating aircraft positions:', error);
    }
  }

  public getAllAircraftPositions(): AircraftPosition[] {
    return Array.from(this.aircraftPositions.values());
  }

  public getAircraftPosition(flightNumber: string): AircraftPosition | null {
    return this.aircraftPositions.get(flightNumber) || null;
  }

  public getAircraftByRoute(route: string): AircraftPosition[] {
    return Array.from(this.aircraftPositions.values())
      .filter(aircraft => aircraft.route === route);
  }

  public getAircraftByStatus(status: string): AircraftPosition[] {
    return Array.from(this.aircraftPositions.values())
      .filter(aircraft => aircraft.current_status === status);
  }

  public getAircraftByAirport(airport: string): AircraftPosition[] {
    return Array.from(this.aircraftPositions.values())
      .filter(aircraft => aircraft.origin === airport || aircraft.destination === airport);
  }

  public getAircraftWithWarnings(): AircraftPosition[] {
    return Array.from(this.aircraftPositions.values())
      .filter(aircraft => aircraft.warnings && aircraft.warnings.length > 0);
  }

  public getNetworkCoverage(): { 
    totalAircraft: number;
    activeRoutes: number;
    airportsServed: string[];
    statusBreakdown: Record<string, number>;
  } {
    const positions = this.getAllAircraftPositions();
    const routes = new Set(positions.map(p => p.route));
    const airports = new Set([
      ...positions.map(p => p.origin),
      ...positions.map(p => p.destination)
    ]);
    
    const statusBreakdown: Record<string, number> = {};
    positions.forEach(p => {
      statusBreakdown[p.current_status] = (statusBreakdown[p.current_status] || 0) + 1;
    });

    return {
      totalAircraft: positions.length,
      activeRoutes: routes.size,
      airportsServed: Array.from(airports).sort(),
      statusBreakdown
    };
  }

  public stopTracking(): void {
    if (this.trackingInterval) {
      clearInterval(this.trackingInterval);
      this.trackingInterval = null;
      console.log('Aircraft tracking service stopped');
    }
  }
}

export { AircraftTrackingService, AircraftPosition };