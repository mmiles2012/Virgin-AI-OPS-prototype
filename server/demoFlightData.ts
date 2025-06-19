import { FlightData } from './aviationApiService';

// Realistic Virgin Atlantic flight routes and patterns for training purposes
const virginAtlanticRoutes = [
  { callsign: 'VS3', origin: 'LHR', destination: 'JFK', aircraft: 'A339' },
  { callsign: 'VS9', origin: 'LHR', destination: 'LAX', aircraft: 'B789' },
  { callsign: 'VS45', origin: 'LHR', destination: 'JFK', aircraft: 'A351' },
  { callsign: 'VS107', origin: 'LHR', destination: 'MIA', aircraft: 'B789' },
  { callsign: 'VS109', origin: 'LHR', destination: 'BOS', aircraft: 'A333' },
  { callsign: 'VS155', origin: 'LHR', destination: 'IAD', aircraft: 'B789' },
  { callsign: 'VS358', origin: 'LGW', destination: 'MCO', aircraft: 'B789' },
  { callsign: 'VS135', origin: 'MAN', destination: 'MCO', aircraft: 'B789' }
];

// Realistic Atlantic crossing coordinates for flight paths
const atlanticWaypoints = [
  { lat: 51.4700, lon: -0.4543 }, // LHR area
  { lat: 53.3536, lon: -6.2603 }, // Dublin area
  { lat: 55.8642, lon: -4.2518 }, // Scotland
  { lat: 59.6498, lon: -19.6056 }, // Iceland area
  { lat: 61.2181, lon: -45.8906 }, // Greenland area
  { lat: 58.7588, lon: -62.1090 }, // Labrador
  { lat: 51.0486, lon: -85.9121 }, // Hudson Bay
  { lat: 45.4215, lon: -75.6972 }, // Ottawa area
  { lat: 43.6532, lon: -79.3832 }, // Toronto area
  { lat: 40.7128, lon: -74.0060 }, // New York area
  { lat: 42.3601, lon: -71.0589 }, // Boston area
  { lat: 38.9072, lon: -77.0369 }, // Washington DC area
  { lat: 34.0522, lon: -118.2437 }, // Los Angeles area
  { lat: 25.7617, lon: -80.1918 }  // Miami area
];

export class DemoFlightDataGenerator {
  private flightStates: Map<string, any> = new Map();
  private lastUpdate: number = Date.now();

  constructor() {
    this.initializeFlights();
  }

  private initializeFlights() {
    virginAtlanticRoutes.forEach(route => {
      const progress = Math.random(); // Random flight progress 0-1
      const startCoord = this.getAirportCoordinates(route.origin);
      const endCoord = this.getAirportCoordinates(route.destination);
      
      // Interpolate position along route with some variation
      const lat = startCoord.lat + (endCoord.lat - startCoord.lat) * progress + (Math.random() - 0.5) * 2;
      const lon = startCoord.lon + (endCoord.lon - startCoord.lon) * progress + (Math.random() - 0.5) * 5;
      
      this.flightStates.set(route.callsign, {
        ...route,
        latitude: lat,
        longitude: lon,
        altitude: 35000 + Math.random() * 8000, // FL350-FL430
        velocity: 450 + Math.random() * 100, // 450-550 knots
        heading: this.calculateHeading(startCoord, endCoord) + (Math.random() - 0.5) * 20,
        progress: progress,
        lastUpdate: Date.now(),
        status: 'en-route'
      });
    });
  }

  private getAirportCoordinates(code: string): { lat: number; lon: number } {
    const airports: Record<string, { lat: number; lon: number }> = {
      'LHR': { lat: 51.4700, lon: -0.4543 },
      'LGW': { lat: 51.1481, lon: -0.1903 },
      'MAN': { lat: 53.3537, lon: -2.2750 },
      'JFK': { lat: 40.6413, lon: -73.7781 },
      'LAX': { lat: 34.0522, lon: -118.2437 },
      'MIA': { lat: 25.7933, lon: -80.2906 },
      'BOS': { lat: 42.3656, lon: -71.0096 },
      'IAD': { lat: 38.9531, lon: -77.4565 },
      'MCO': { lat: 28.4312, lon: -81.3081 }
    };
    return airports[code] || { lat: 0, lon: 0 };
  }

  private calculateHeading(start: { lat: number; lon: number }, end: { lat: number; lon: number }): number {
    const dLon = (end.lon - start.lon) * Math.PI / 180;
    const lat1 = start.lat * Math.PI / 180;
    const lat2 = end.lat * Math.PI / 180;
    
    const y = Math.sin(dLon) * Math.cos(lat2);
    const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
    
    const heading = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    return Math.round(heading);
  }

  updateFlightPositions(): void {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000 / 3600; // hours
    
    this.flightStates.forEach((flight, callsign) => {
      // Update position based on velocity and heading
      const distance = flight.velocity * deltaTime; // nautical miles
      const lat1 = flight.latitude * Math.PI / 180;
      const lon1 = flight.longitude * Math.PI / 180;
      const bearing = flight.heading * Math.PI / 180;
      
      const earthRadius = 3440.065; // nautical miles
      const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(distance / earthRadius) +
        Math.cos(lat1) * Math.sin(distance / earthRadius) * Math.cos(bearing)
      );
      
      const lon2 = lon1 + Math.atan2(
        Math.sin(bearing) * Math.sin(distance / earthRadius) * Math.cos(lat1),
        Math.cos(distance / earthRadius) - Math.sin(lat1) * Math.sin(lat2)
      );
      
      // Add some realistic flight path variation
      const variation = (Math.random() - 0.5) * 0.1;
      
      this.flightStates.set(callsign, {
        ...flight,
        latitude: (lat2 * 180 / Math.PI) + variation,
        longitude: (lon2 * 180 / Math.PI) + variation,
        altitude: flight.altitude + (Math.random() - 0.5) * 500, // Small altitude variations
        velocity: flight.velocity + (Math.random() - 0.5) * 20, // Speed variations
        heading: flight.heading + (Math.random() - 0.5) * 5, // Heading adjustments
        lastUpdate: now
      });
    });
    
    this.lastUpdate = now;
  }

  getVirginAtlanticFlights(): FlightData[] {
    this.updateFlightPositions();
    
    return Array.from(this.flightStates.values()).map(flight => ({
      callsign: flight.callsign,
      latitude: flight.latitude,
      longitude: flight.longitude,
      altitude: Math.round(flight.altitude),
      velocity: Math.round(flight.velocity),
      heading: Math.round(flight.heading) % 360,
      aircraft: flight.aircraft,
      origin: flight.origin,
      destination: flight.destination,
      status: flight.status,
      departureTime: undefined,
      arrivalTime: undefined
    }));
  }

  // Simulate emergency scenarios for training
  createEmergencyScenario(callsign: string, type: 'medical' | 'technical' | 'fuel'): void {
    const flight = this.flightStates.get(callsign);
    if (flight) {
      switch (type) {
        case 'medical':
          flight.status = 'medical_emergency';
          break;
        case 'technical':
          flight.status = 'technical_issue';
          flight.altitude = Math.max(flight.altitude - 5000, 10000); // Emergency descent
          break;
        case 'fuel':
          flight.status = 'fuel_emergency';
          flight.velocity = Math.max(flight.velocity - 50, 300); // Reduce speed
          break;
      }
      this.flightStates.set(callsign, flight);
    }
  }
}

export const demoFlightGenerator = new DemoFlightDataGenerator();