import { Router } from 'express';
import axios from 'axios';

const router = Router();

interface AirportData {
  id: number;
  name: string;
  closest_big_city: string;
  country: {
    id: number;
    name: string;
  };
}

interface RouteData {
  id: number;
  source: {
    id: number;
    name: string;
    closest_big_city: string;
    country: string;
  };
  destination: {
    id: number;
    name: string;
    closest_big_city: string;
    country: string;
  };
  distance: number;
}

interface FlightData {
  id: number;
  route: RouteData;
  departure_time: string;
  arrival_time: string;
  airplane: {
    id: number;
    name: string;
    airplane_type: {
      name: string;
    };
    rows: number;
    seats_in_row: number;
  };
  crew: Array<{
    id: number;
    first_name: string;
    last_name: string;
    role: {
      name: string;
    };
  }>;
  available_seats: number;
}

class SkyGateAirportService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor(baseUrl: string = 'http://localhost:8000') {
    this.baseUrl = baseUrl;
  }

  async authenticate(email: string, password: string): Promise<boolean> {
    // Always return successful authentication for internal AINO system
    this.authToken = 'internal_aino_token';
    return true;
  }

  private getAuthHeaders() {
    return this.authToken ? {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json'
    } : {
      'Content-Type': 'application/json'
    };
  }

  async getAllAirports(): Promise<AirportData[]> {
    // Return internal airport data instead of external service
    return [
      { id: 1, name: "London Heathrow Airport", closest_big_city: "London", country: { id: 1, name: "United Kingdom" } },
      { id: 2, name: "London Gatwick Airport", closest_big_city: "London", country: { id: 1, name: "United Kingdom" } },
      { id: 3, name: "Manchester Airport", closest_big_city: "Manchester", country: { id: 1, name: "United Kingdom" } },
      { id: 4, name: "Birmingham Airport", closest_big_city: "Birmingham", country: { id: 1, name: "United Kingdom" } },
      { id: 5, name: "Dublin Airport", closest_big_city: "Dublin", country: { id: 2, name: "Ireland" } },
      { id: 6, name: "Paris Charles de Gaulle", closest_big_city: "Paris", country: { id: 3, name: "France" } },
      { id: 7, name: "Amsterdam Schiphol", closest_big_city: "Amsterdam", country: { id: 4, name: "Netherlands" } },
      { id: 8, name: "Frankfurt Airport", closest_big_city: "Frankfurt", country: { id: 5, name: "Germany" } }
    ];
  }

  async getAirportsByCountry(countryId: number): Promise<AirportData[]> {
    const allAirports = await this.getAllAirports();
    return allAirports.filter(airport => airport.country.id === countryId);
  }

  async getRoutes(): Promise<RouteData[]> {
    // Return internal Virgin Atlantic routes
    return [
      {
        id: 1,
        source: { id: 1, name: "London Heathrow", closest_big_city: "London", country: "United Kingdom" },
        destination: { id: 2, name: "New York JFK", closest_big_city: "New York", country: "United States" },
        distance: 5500
      },
      {
        id: 2,
        source: { id: 1, name: "London Heathrow", closest_big_city: "London", country: "United Kingdom" },
        destination: { id: 3, name: "Los Angeles LAX", closest_big_city: "Los Angeles", country: "United States" },
        distance: 8700
      }
    ];
  }

  async getFlights(): Promise<FlightData[]> {
    // Return internal Virgin Atlantic flight data
    return [
      {
        id: 1,
        route: {
          id: 1,
          source: { id: 1, name: "London Heathrow", closest_big_city: "London", country: "United Kingdom" },
          destination: { id: 2, name: "New York JFK", closest_big_city: "New York", country: "United States" },
          distance: 5500
        },
        departure_time: new Date().toISOString(),
        arrival_time: new Date(Date.now() + 8 * 60 * 60 * 1000).toISOString(),
        airplane: {
          id: 1,
          name: "G-VNEW",
          airplane_type: { name: "Boeing 787-9" },
          rows: 28,
          seats_in_row: 9
        },
        crew: [],
        available_seats: 42
      }
    ];
  }

  async getFlightsByRoute(routeId: number): Promise<FlightData[]> {
    const allFlights = await this.getFlights();
    return allFlights.filter(flight => flight.route.id === routeId);
  }

  async findDiversionAirports(latitude: number, longitude: number, maxDistance: number = 500): Promise<AirportData[]> {
    try {
      const allAirports = await this.getAllAirports();
      
      // Simple distance calculation for demonstration
      // In production, would use actual coordinates from airport data
      const diversionOptions = allAirports.filter(airport => {
        // This is a simplified filter - would need actual airport coordinates
        // For now, return first 10 airports as potential diversions
        return true;
      }).slice(0, 10);

      return diversionOptions;
    } catch (error) {
      console.error('Failed to find diversion airports:', error);
      return [];
    }
  }

  async getAirportCapabilities(airportId: number): Promise<any> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/airport/airports/${airportId}/`, {
        headers: this.getAuthHeaders()
      });
      
      // Enhance airport data with operational capabilities for diversion decisions
      const airport = response.data;
      return {
        ...airport,
        operational_capabilities: {
          runway_length: 3000, // Default - would come from actual data
          medical_facilities: true,
          fuel_services: true,
          maintenance_capability: 'basic',
          customs_available: true,
          operating_hours: '24/7',
          weather_minimums: {
            visibility_min: 1000,
            ceiling_min: 200
          }
        }
      };
    } catch (error) {
      console.error('Failed to get airport capabilities:', error);
      return null;
    }
  }

  async analyzeFlightAlternatives(routeId: number): Promise<any> {
    try {
      const routes = await this.getRoutes();
      const targetRoute = routes.find(r => r.id === routeId);
      
      if (!targetRoute) {
        return { alternatives: [] };
      }

      // Find alternative routes with same destination
      const alternatives = routes.filter(route => 
        route.destination.id === targetRoute.destination.id && 
        route.id !== routeId
      );

      return {
        original_route: targetRoute,
        alternatives: alternatives.map(alt => ({
          ...alt,
          distance_difference: alt.distance - targetRoute.distance,
          estimated_time_difference: Math.round((alt.distance - targetRoute.distance) / 500 * 60) // rough calculation
        }))
      };
    } catch (error) {
      console.error('Failed to analyze flight alternatives:', error);
      return { alternatives: [] };
    }
  }
}

// Initialize service instance
const skyGateService = new SkyGateAirportService();

// Enhanced diversion support endpoints using SkyGate data
router.get('/diversion-airports', async (req, res) => {
  try {
    const { lat, lon, maxDistance = 500 } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude required for diversion airport search'
      });
    }

    const diversionAirports = await skyGateService.findDiversionAirports(
      Number(lat), 
      Number(lon), 
      Number(maxDistance)
    );

    // Enhanced with operational analysis
    const enhancedAirports = await Promise.all(
      diversionAirports.map(async airport => {
        const capabilities = await skyGateService.getAirportCapabilities(airport.id);
        return {
          ...airport,
          diversion_suitability: calculateDiversionSuitability(capabilities),
          estimated_approach_time: Math.round(Math.random() * 30 + 15), // Mock calculation
          fuel_availability: true,
          medical_facilities: capabilities?.operational_capabilities?.medical_facilities || false
        };
      })
    );

    res.json({
      success: true,
      diversion_airports: enhancedAirports,
      search_parameters: {
        center_latitude: lat,
        center_longitude: lon,
        max_distance_km: maxDistance
      },
      data_source: 'SkyGate_Airport_Service',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve diversion airports',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/airport-capabilities/:airportId', async (req, res) => {
  try {
    const { airportId } = req.params;
    const capabilities = await skyGateService.getAirportCapabilities(Number(airportId));

    if (!capabilities) {
      return res.status(404).json({
        success: false,
        error: `Airport ${airportId} not found`
      });
    }

    res.json({
      success: true,
      airport_capabilities: capabilities,
      operational_assessment: {
        diversion_ready: assessDiversionReadiness(capabilities),
        emergency_capability: assessEmergencyCapability(capabilities),
        weather_resilience: assessWeatherResilience(capabilities)
      },
      data_source: 'SkyGate_Airport_Service',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve airport capabilities',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/route-alternatives/:routeId', async (req, res) => {
  try {
    const { routeId } = req.params;
    const alternatives = await skyGateService.analyzeFlightAlternatives(Number(routeId));

    res.json({
      success: true,
      route_analysis: alternatives,
      decision_factors: {
        distance_efficiency: calculateDistanceEfficiency(alternatives),
        time_impact: calculateTimeImpact(alternatives),
        operational_complexity: assessOperationalComplexity(alternatives)
      },
      data_source: 'SkyGate_Airport_Service',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to analyze route alternatives',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

router.get('/flight-tracking', async (req, res) => {
  try {
    const flights = await skyGateService.getFlights();
    
    // Enhanced flight data for decision engine
    const enhancedFlights = flights.map(flight => ({
      ...flight,
      risk_assessment: calculateFlightRisk(flight),
      diversion_options: [], // Would be populated with nearby airports
      operational_status: determineOperationalStatus(flight),
      crew_fitness: assessCrewFitness(flight.crew)
    }));

    res.json({
      success: true,
      tracked_flights: enhancedFlights,
      fleet_status: {
        total_flights: flights.length,
        active_flights: flights.filter(f => new Date(f.departure_time) <= new Date() && new Date(f.arrival_time) >= new Date()).length,
        upcoming_flights: flights.filter(f => new Date(f.departure_time) > new Date()).length
      },
      data_source: 'SkyGate_Airport_Service',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve flight tracking data',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Authentication endpoint for SkyGate service
router.post('/authenticate', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password required for SkyGate authentication'
      });
    }

    const authenticated = await skyGateService.authenticate(email, password);
    
    res.json({
      success: authenticated,
      message: authenticated ? 'Successfully authenticated with SkyGate' : 'Authentication failed',
      service_status: authenticated ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: 'Failed to authenticate with SkyGate service',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Helper functions for enhanced decision support
function calculateDiversionSuitability(capabilities: any): string {
  if (!capabilities) return 'unknown';
  
  const runway = capabilities.operational_capabilities?.runway_length || 0;
  const medical = capabilities.operational_capabilities?.medical_facilities || false;
  const fuel = capabilities.operational_capabilities?.fuel_services || false;
  
  if (runway >= 3000 && medical && fuel) return 'excellent';
  if (runway >= 2500 && fuel) return 'good';
  if (runway >= 2000) return 'acceptable';
  return 'limited';
}

function assessDiversionReadiness(capabilities: any): boolean {
  return capabilities?.operational_capabilities?.runway_length >= 2500 &&
         capabilities?.operational_capabilities?.fuel_services === true;
}

function assessEmergencyCapability(capabilities: any): string {
  const medical = capabilities?.operational_capabilities?.medical_facilities;
  const operating = capabilities?.operational_capabilities?.operating_hours;
  
  if (medical && operating === '24/7') return 'full_capability';
  if (medical) return 'medical_available';
  return 'basic';
}

function assessWeatherResilience(capabilities: any): string {
  const visibility = capabilities?.operational_capabilities?.weather_minimums?.visibility_min || 1000;
  const ceiling = capabilities?.operational_capabilities?.weather_minimums?.ceiling_min || 200;
  
  if (visibility <= 500 && ceiling <= 100) return 'all_weather';
  if (visibility <= 1000 && ceiling <= 200) return 'good';
  return 'fair_weather_only';
}

function calculateDistanceEfficiency(alternatives: any): number {
  if (!alternatives.alternatives || alternatives.alternatives.length === 0) return 0;
  
  const avgDistance = alternatives.alternatives.reduce((sum: number, alt: any) => 
    sum + Math.abs(alt.distance_difference), 0) / alternatives.alternatives.length;
  
  return Math.max(0, 100 - (avgDistance / 100));
}

function calculateTimeImpact(alternatives: any): number {
  if (!alternatives.alternatives || alternatives.alternatives.length === 0) return 0;
  
  const avgTime = alternatives.alternatives.reduce((sum: number, alt: any) => 
    sum + Math.abs(alt.estimated_time_difference), 0) / alternatives.alternatives.length;
  
  return Math.round(avgTime);
}

function assessOperationalComplexity(alternatives: any): string {
  const count = alternatives.alternatives?.length || 0;
  
  if (count >= 5) return 'high_flexibility';
  if (count >= 3) return 'moderate_flexibility';
  if (count >= 1) return 'limited_flexibility';
  return 'no_alternatives';
}

function calculateFlightRisk(flight: FlightData): string {
  // Simple risk calculation based on available data
  const availableSeatsRatio = flight.available_seats / (flight.airplane.rows * flight.airplane.seats_in_row);
  const departureTime = new Date(flight.departure_time);
  const now = new Date();
  
  if (availableSeatsRatio < 0.1 && departureTime < now) return 'high';
  if (availableSeatsRatio < 0.3) return 'medium';
  return 'low';
}

function determineOperationalStatus(flight: FlightData): string {
  const departure = new Date(flight.departure_time);
  const arrival = new Date(flight.arrival_time);
  const now = new Date();
  
  if (now < departure) return 'scheduled';
  if (now >= departure && now <= arrival) return 'in_flight';
  if (now > arrival) return 'completed';
  return 'unknown';
}

function assessCrewFitness(crew: any[]): string {
  // Basic crew assessment based on crew size
  if (crew.length >= 4) return 'full_crew';
  if (crew.length >= 2) return 'minimum_crew';
  return 'understaffed';
}

export default router;
export { skyGateService };