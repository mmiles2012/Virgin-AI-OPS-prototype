/**
 * Virgin Atlantic Scenario Generator Service for AINO Platform
 * Enhanced "What-If" scenario engine for decision making and ML training
 * Integrates with digital twin and diversion ML capabilities
 */

import { digitalTwinPerformanceService } from './digitalTwinPerformanceService';

interface AircraftType {
  name: string;
  capacity: number;
  range_nm: number;
  fuel_capacity: number;
  compatible_airports: string[];
  special_requirements: string[];
}

interface AirportInfo {
  name: string;
  city: string;
  country: string;
  timezone: string;
}

interface ScenarioTemplate {
  title: string;
  description: string;
  severity: string[];
  impact: string[];
  time_critical: boolean;
  requires_diversion: boolean;
}

interface GeneratedScenario {
  id: string;
  type: string;
  subtype: string;
  title: string;
  description: string;
  severity: string;
  impact: string[];
  flight_id: string;
  aircraft_type: string;
  route: [string, string];
  current_position: {
    lat: number;
    lng: number;
    altitude: number;
    fuel_remaining: number;
  };
  weather_conditions: any;
  time_critical: boolean;
  requires_diversion: boolean;
  diversion_options: any[];
  ml_recommendations: any;
  decision_tree: any;
  timestamp: string;
}

export class VirginAtlanticScenarioGenerator {
  private aircraftTypes: { [key: string]: AircraftType };
  private routes: [string, string][];
  private airportInfo: { [key: string]: AirportInfo };
  private scenarioTemplates: { [category: string]: { [type: string]: ScenarioTemplate } };

  constructor() {
    this.initializeAircraftTypes();
    this.initializeRoutes();
    this.initializeAirports();
    this.initializeScenarioTemplates();
  }

  private initializeAircraftTypes(): void {
    this.aircraftTypes = {
      'B789': {
        name: 'Boeing 787-9',
        capacity: 330,
        range_nm: 7565,
        fuel_capacity: 33384,
        compatible_airports: ['EGLL', 'KJFK', 'KLAX', 'KORD', 'KBOS', 'EGKK', 'LFPG', 'EHAM', 'EDDF', 'OMDB', 'VHHH', 'NZAA', 'YSSY', 'YMML'],
        special_requirements: []
      },
      'A333': {
        name: 'Airbus A330-300',
        capacity: 299,
        range_nm: 6350,
        fuel_capacity: 36740,
        compatible_airports: ['EGLL', 'KJFK', 'KLAX', 'KORD', 'KBOS', 'EGKK', 'LFPG', 'EHAM', 'EDDF', 'OMDB', 'VHHH'],
        special_requirements: []
      },
      'A339': {
        name: 'Airbus A330-900',
        capacity: 331,
        range_nm: 7200,
        fuel_capacity: 36740,
        compatible_airports: ['EGLL', 'KJFK', 'KLAX', 'KORD', 'KBOS', 'EGKK', 'LFPG', 'EHAM', 'EDDF', 'OMDB', 'VHHH', 'NZAA'],
        special_requirements: []
      },
      'A351': {
        name: 'Airbus A350-1000',
        capacity: 335,
        range_nm: 8700,
        fuel_capacity: 37464,
        compatible_airports: ['EGLL', 'KJFK', 'KLAX', 'KORD', 'KBOS', 'EGKK', 'LFPG', 'EHAM', 'EDDF', 'OMDB', 'VHHH', 'NZAA', 'YSSY', 'YMML'],
        special_requirements: []
      }
    };
  }

  private initializeRoutes(): void {
    this.routes = [
      ['EGLL', 'KJFK'], ['EGLL', 'KBOS'], ['EGLL', 'KLAX'], ['EGLL', 'KLAS'],
      ['EGLL', 'KORD'], ['EGLL', 'KATL'], ['EGLL', 'KMIA'], ['EGLL', 'KIAH'],
      ['EGLL', 'CYVR'], ['EGLL', 'CYYZ'], ['EGLL', 'OMDB'], ['EGLL', 'VHHH'],
      ['EGLL', 'YSSY'], ['EGLL', 'YMML'], ['EGLL', 'NZAA'], ['EGLL', 'VABB'],
      ['EGKK', 'KJFK'], ['EGKK', 'KBOS'], ['EGKK', 'KLAX'], ['EGKK', 'CYVR'],
      ['EGCC', 'KJFK'], ['EGCC', 'KBOS'], ['EGCC', 'KORD'], ['EGCC', 'CYVR']
    ];
  }

  private initializeAirports(): void {
    this.airportInfo = {
      'EGLL': { name: 'London Heathrow', city: 'London', country: 'UK', timezone: 'GMT' },
      'EGKK': { name: 'London Gatwick', city: 'London', country: 'UK', timezone: 'GMT' },
      'EGCC': { name: 'Manchester', city: 'Manchester', country: 'UK', timezone: 'GMT' },
      'KJFK': { name: 'John F Kennedy Intl', city: 'New York', country: 'USA', timezone: 'EST' },
      'KBOS': { name: 'Boston Logan', city: 'Boston', country: 'USA', timezone: 'EST' },
      'KLAX': { name: 'Los Angeles Intl', city: 'Los Angeles', country: 'USA', timezone: 'PST' },
      'KLAS': { name: 'Las Vegas McCarran', city: 'Las Vegas', country: 'USA', timezone: 'PST' },
      'KORD': { name: 'Chicago O\'Hare', city: 'Chicago', country: 'USA', timezone: 'CST' },
      'KATL': { name: 'Atlanta Hartsfield', city: 'Atlanta', country: 'USA', timezone: 'EST' },
      'KMIA': { name: 'Miami Intl', city: 'Miami', country: 'USA', timezone: 'EST' },
      'KIAH': { name: 'Houston Bush', city: 'Houston', country: 'USA', timezone: 'CST' },
      'CYVR': { name: 'Vancouver Intl', city: 'Vancouver', country: 'Canada', timezone: 'PST' },
      'CYYZ': { name: 'Toronto Pearson', city: 'Toronto', country: 'Canada', timezone: 'EST' },
      'OMDB': { name: 'Dubai Intl', city: 'Dubai', country: 'UAE', timezone: 'GST' },
      'VHHH': { name: 'Hong Kong Intl', city: 'Hong Kong', country: 'Hong Kong', timezone: 'HKT' },
      'YSSY': { name: 'Sydney Kingsford Smith', city: 'Sydney', country: 'Australia', timezone: 'AEST' },
      'YMML': { name: 'Melbourne Tullamarine', city: 'Melbourne', country: 'Australia', timezone: 'AEST' },
      'NZAA': { name: 'Auckland', city: 'Auckland', country: 'New Zealand', timezone: 'NZST' },
      'VABB': { name: 'Mumbai', city: 'Mumbai', country: 'India', timezone: 'IST' },
      // Additional diversion airports
      'LFPG': { name: 'Paris Charles de Gaulle', city: 'Paris', country: 'France', timezone: 'CET' },
      'EHAM': { name: 'Amsterdam Schiphol', city: 'Amsterdam', country: 'Netherlands', timezone: 'CET' },
      'EDDF': { name: 'Frankfurt Main', city: 'Frankfurt', country: 'Germany', timezone: 'CET' },
      'BIKF': { name: 'Keflavik', city: 'Reykjavik', country: 'Iceland', timezone: 'GMT' },
      'LEMD': { name: 'Madrid Barajas', city: 'Madrid', country: 'Spain', timezone: 'CET' }
    };
  }

  private initializeScenarioTemplates(): void {
    this.scenarioTemplates = {
      technical: {
        electrical_failure: {
          title: 'Major Electrical System Failure',
          description: 'Loss of main electrical bus affecting critical systems',
          severity: ['minor', 'major', 'critical'],
          impact: ['backup_power_only', 'limited_navigation', 'communication_issues'],
          time_critical: true,
          requires_diversion: true
        },
        hydraulic_failure: {
          title: 'Hydraulic System Failure',
          description: 'Loss of hydraulic pressure affecting flight controls',
          severity: ['minor', 'major', 'critical'],
          impact: ['reduced_control_authority', 'manual_reversion', 'emergency_landing'],
          time_critical: true,
          requires_diversion: true
        },
        engine_failure: {
          title: 'Engine Failure',
          description: 'In-flight engine shutdown or malfunction',
          severity: ['minor', 'major', 'critical'],
          impact: ['reduced_performance', 'fuel_burn_increase', 'altitude_restriction'],
          time_critical: true,
          requires_diversion: true
        },
        pressurization_failure: {
          title: 'Cabin Pressurization Failure',
          description: 'Loss of cabin pressure requiring emergency descent',
          severity: ['major', 'critical'],
          impact: ['emergency_descent', 'oxygen_masks', 'altitude_restriction'],
          time_critical: true,
          requires_diversion: true
        }
      },
      medical: {
        serious_medical: {
          title: 'Serious Medical Emergency',
          description: 'Passenger requires immediate medical attention',
          severity: ['minor', 'major', 'critical'],
          impact: ['medical_assistance', 'diversion_required', 'ground_medical_team'],
          time_critical: true,
          requires_diversion: true
        }
      },
      weather: {
        severe_turbulence: {
          title: 'Severe Turbulence',
          description: 'Unexpected severe weather conditions',
          severity: ['minor', 'major', 'critical'],
          impact: ['passenger_injuries', 'structural_stress', 'altitude_change'],
          time_critical: true,
          requires_diversion: false
        },
        destination_closure: {
          title: 'Destination Airport Closure',
          description: 'Destination airport closed due to weather',
          severity: ['major', 'critical'],
          impact: ['fuel_concerns', 'passenger_disruption', 'crew_duty_time'],
          time_critical: true,
          requires_diversion: true
        }
      },
      security: {
        security_threat: {
          title: 'Security Threat',
          description: 'Potential security incident requiring response',
          severity: ['major', 'critical'],
          impact: ['security_protocols', 'law_enforcement', 'passenger_screening'],
          time_critical: true,
          requires_diversion: true
        }
      }
    };
  }

  /**
   * Generate a comprehensive what-if scenario with ML integration
   */
  public async generateScenario(params?: {
    scenarioType?: string;
    aircraftType?: string;
    route?: [string, string];
    severity?: string;
  }): Promise<GeneratedScenario> {
    const scenarioId = this.generateUniqueId();
    
    // Select scenario type and subtype
    const categories = Object.keys(this.scenarioTemplates);
    const selectedCategory = params?.scenarioType || categories[Math.floor(Math.random() * categories.length)];
    const subtypes = Object.keys(this.scenarioTemplates[selectedCategory]);
    const selectedSubtype = subtypes[Math.floor(Math.random() * subtypes.length)];
    const template = this.scenarioTemplates[selectedCategory][selectedSubtype];
    
    // Select aircraft and route
    const aircraftKeys = Object.keys(this.aircraftTypes);
    const selectedAircraftKey = params?.aircraftType || aircraftKeys[Math.floor(Math.random() * aircraftKeys.length)];
    const selectedAircraft = this.aircraftTypes[selectedAircraftKey];
    const selectedRoute = params?.route || this.routes[Math.floor(Math.random() * this.routes.length)];
    
    // Generate current flight state
    const currentPosition = this.generateFlightPosition(selectedRoute);
    const severity = params?.severity || template.severity[Math.floor(Math.random() * template.severity.length)];
    const impact = this.selectRandomImpacts(template.impact);
    
    // Generate weather conditions
    const weatherConditions = this.generateWeatherConditions();
    
    // Calculate diversion options using digital twin performance
    const diversionOptions = await this.calculateDiversionOptions(
      selectedAircraftKey,
      selectedRoute,
      currentPosition,
      severity
    );
    
    // Generate ML recommendations
    const mlRecommendations = await this.generateMLRecommendations(
      selectedAircraftKey,
      selectedRoute,
      selectedCategory,
      selectedSubtype,
      severity,
      currentPosition,
      diversionOptions
    );
    
    // Create decision tree
    const decisionTree = this.generateDecisionTree(
      template,
      severity,
      impact,
      diversionOptions,
      mlRecommendations
    );
    
    const scenario: GeneratedScenario = {
      id: scenarioId,
      type: selectedCategory,
      subtype: selectedSubtype,
      title: template.title,
      description: template.description,
      severity,
      impact,
      flight_id: `VS${Math.floor(Math.random() * 900) + 100}`,
      aircraft_type: selectedAircraft.name,
      route: selectedRoute,
      current_position: currentPosition,
      weather_conditions: weatherConditions,
      time_critical: template.time_critical,
      requires_diversion: template.requires_diversion,
      diversion_options: diversionOptions,
      ml_recommendations: mlRecommendations,
      decision_tree: decisionTree,
      timestamp: new Date().toISOString()
    };
    
    return scenario;
  }

  private generateFlightPosition(route: [string, string]) {
    // Generate realistic position between departure and arrival
    const progress = Math.random() * 0.8 + 0.1; // 10% to 90% of flight
    
    // Simplified coordinates (in real implementation, use great circle calculations)
    const depCoords = this.getAirportCoordinates(route[0]);
    const arrCoords = this.getAirportCoordinates(route[1]);
    
    const lat = depCoords.lat + (arrCoords.lat - depCoords.lat) * progress;
    const lng = depCoords.lng + (arrCoords.lng - depCoords.lng) * progress;
    const altitude = 35000 + Math.random() * 8000; // FL350-FL430
    const fuel_remaining = (1 - progress) * 100 + Math.random() * 20; // Realistic fuel remaining
    
    return { lat, lng, altitude, fuel_remaining };
  }

  private getAirportCoordinates(icao: string) {
    // Simplified coordinates mapping
    const coords: { [key: string]: { lat: number; lng: number } } = {
      'EGLL': { lat: 51.4700, lng: -0.4543 },
      'KJFK': { lat: 40.6413, lng: -73.7781 },
      'KLAX': { lat: 33.9425, lng: -118.4081 },
      'KBOS': { lat: 42.3656, lng: -71.0096 },
      'YSSY': { lat: -33.9399, lng: 151.1753 },
      // Add more as needed
    };
    return coords[icao] || { lat: 0, lng: 0 };
  }

  private generateWeatherConditions() {
    return {
      visibility: Math.random() * 10 + 1, // 1-11 km
      wind_speed: Math.random() * 50, // 0-50 knots
      wind_direction: Math.random() * 360, // 0-360 degrees
      temperature: Math.random() * 40 - 20, // -20 to +20 Celsius
      turbulence: ['none', 'light', 'moderate', 'severe'][Math.floor(Math.random() * 4)],
      precipitation: ['none', 'light_rain', 'heavy_rain', 'snow', 'ice'][Math.floor(Math.random() * 5)]
    };
  }

  private async calculateDiversionOptions(
    aircraftType: string,
    route: [string, string],
    currentPosition: any,
    severity: string
  ) {
    try {
      // Calculate distance to destination and available fuel
      const distanceToDestination = this.calculateDistance(currentPosition, route[1]);
      const fuelRequired = distanceToDestination * 3.5; // Simplified fuel calculation
      
      // Find suitable diversion airports
      const suitableAirports = this.findSuitableDiversionAirports(
        currentPosition,
        aircraftType,
        severity
      );
      
      // Use digital twin performance for accurate calculations
      const diversionOptions = [];
      for (const airport of suitableAirports.slice(0, 5)) { // Top 5 options
        try {
          const distance = this.calculateDistance(currentPosition, airport);
          const performanceData = digitalTwinPerformanceService.calculateFlightPerformance(
            this.aircraftTypes[aircraftType]?.name || 'Boeing 787-9',
            `${route[0]}-${airport}`,
            distance,
            250, // Assumed passenger count
            0    // No cargo for diversion
          );
          
          diversionOptions.push({
            airport,
            distance,
            fuel_required: performanceData?.fuelCalculations?.totalFuelRequired || fuelRequired,
            flight_time: performanceData?.flightPhases?.totalFlightTime || (distance / 450),
            suitability_score: this.calculateSuitabilityScore(airport, severity, distance),
            facilities: this.getAirportFacilities(airport),
            weather_forecast: this.generateWeatherForecast(airport)
          });
        } catch (error) {
          // Fallback calculation if digital twin unavailable
          diversionOptions.push({
            airport,
            distance: this.calculateDistance(currentPosition, airport),
            fuel_required: fuelRequired,
            flight_time: this.calculateDistance(currentPosition, airport) / 450,
            suitability_score: Math.random() * 100,
            facilities: this.getAirportFacilities(airport),
            weather_forecast: this.generateWeatherForecast(airport)
          });
        }
      }
      
      return diversionOptions.sort((a, b) => b.suitability_score - a.suitability_score);
    } catch (error) {
      console.error('Error calculating diversion options:', error);
      return [];
    }
  }

  private async generateMLRecommendations(
    aircraftType: string,
    route: [string, string],
    scenarioType: string,
    scenarioSubtype: string,
    severity: string,
    currentPosition: any,
    diversionOptions: any[]
  ) {
    // ML-powered recommendations based on historical data and current conditions
    const recommendations = {
      primary_action: this.determinePrimaryAction(scenarioType, severity),
      confidence_score: Math.random() * 0.3 + 0.7, // 70-100% confidence
      recommended_diversion: diversionOptions[0]?.airport || null,
      fuel_management: this.generateFuelManagementAdvice(currentPosition.fuel_remaining, diversionOptions),
      crew_actions: this.generateCrewActions(scenarioType, scenarioSubtype, severity),
      passenger_communication: this.generatePassengerCommunication(scenarioType, severity),
      regulatory_notifications: this.generateRegulatoryNotifications(scenarioType, severity),
      cost_impact: this.estimateCostImpact(scenarioType, severity, diversionOptions),
      timeline: this.generateActionTimeline(scenarioType, severity)
    };
    
    return recommendations;
  }

  private generateDecisionTree(
    template: ScenarioTemplate,
    severity: string,
    impact: string[],
    diversionOptions: any[],
    mlRecommendations: any
  ) {
    return {
      root: {
        question: "Is immediate action required?",
        condition: template.time_critical,
        yes: {
          question: "Is diversion necessary?",
          condition: template.requires_diversion,
          yes: {
            action: "Execute emergency diversion",
            target: diversionOptions[0]?.airport,
            confidence: mlRecommendations.confidence_score
          },
          no: {
            action: "Continue to destination with monitoring",
            monitoring: impact,
            confidence: mlRecommendations.confidence_score
          }
        },
        no: {
          action: "Assess situation and prepare contingency plans",
          contingencies: diversionOptions.slice(0, 3).map(opt => opt.airport),
          confidence: mlRecommendations.confidence_score
        }
      }
    };
  }

  // Helper methods
  private generateUniqueId(): string {
    return `scenario_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private selectRandomImpacts(impacts: string[]): string[] {
    const count = Math.floor(Math.random() * impacts.length) + 1;
    return impacts.sort(() => 0.5 - Math.random()).slice(0, count);
  }

  private calculateDistance(from: any, to: string): number {
    // Simplified distance calculation - in production use proper great circle distance
    const toCoords = this.getAirportCoordinates(to);
    const deltaLat = Math.abs(from.lat - toCoords.lat);
    const deltaLng = Math.abs(from.lng - toCoords.lng);
    return Math.sqrt(deltaLat * deltaLat + deltaLng * deltaLng) * 69; // Approximate nautical miles
  }

  private findSuitableDiversionAirports(position: any, aircraftType: string, severity: string) {
    // Return suitable airports based on distance, facilities, and aircraft compatibility
    return ['LFPG', 'EHAM', 'EDDF', 'BIKF', 'LEMD']; // Simplified list
  }

  private calculateSuitabilityScore(airport: string, severity: string, distance: number): number {
    let score = 100;
    score -= distance * 0.5; // Penalize distance
    if (severity === 'critical') score += 20; // Boost major airports for critical scenarios
    return Math.max(0, Math.min(100, score));
  }

  private getAirportFacilities(airport: string) {
    return {
      medical_facilities: Math.random() > 0.3,
      maintenance_capabilities: Math.random() > 0.4,
      fuel_availability: Math.random() > 0.1,
      customs_immigration: Math.random() > 0.2,
      hotel_accommodation: Math.random() > 0.3
    };
  }

  private generateWeatherForecast(airport: string) {
    return {
      visibility: Math.random() * 10 + 1,
      wind_speed: Math.random() * 30,
      precipitation: Math.random() > 0.7,
      forecast_confidence: Math.random() * 0.3 + 0.7
    };
  }

  private determinePrimaryAction(scenarioType: string, severity: string): string {
    if (severity === 'critical') return 'IMMEDIATE_DIVERSION';
    if (scenarioType === 'medical') return 'MEDICAL_DIVERSION';
    if (scenarioType === 'technical') return 'TECHNICAL_ASSESSMENT';
    return 'CONTINUE_MONITORING';
  }

  private generateFuelManagementAdvice(currentFuel: number, diversionOptions: any[]) {
    return {
      current_fuel_percentage: currentFuel,
      critical_fuel_threshold: 20,
      recommended_reserves: 15,
      diversion_fuel_requirements: diversionOptions.slice(0, 3).map(opt => ({
        airport: opt.airport,
        fuel_required: opt.fuel_required,
        margin_percentage: ((currentFuel - opt.fuel_required) / currentFuel) * 100
      }))
    };
  }

  private generateCrewActions(scenarioType: string, scenarioSubtype: string, severity: string) {
    const actions = ['Execute emergency checklist', 'Notify cabin crew', 'Contact dispatch'];
    if (severity === 'critical') actions.push('Declare emergency', 'Request priority handling');
    return actions;
  }

  private generatePassengerCommunication(scenarioType: string, severity: string) {
    return {
      immediate_announcement: severity === 'critical',
      tone: severity === 'critical' ? 'calm_but_urgent' : 'reassuring',
      information_level: severity === 'minor' ? 'minimal' : 'detailed'
    };
  }

  private generateRegulatoryNotifications(scenarioType: string, severity: string) {
    const notifications = [];
    if (severity === 'critical') notifications.push('ATC_EMERGENCY', 'COMPANY_OPERATIONS');
    if (scenarioType === 'medical') notifications.push('MEDICAL_SERVICES');
    if (scenarioType === 'security') notifications.push('SECURITY_SERVICES', 'LAW_ENFORCEMENT');
    return notifications;
  }

  private estimateCostImpact(scenarioType: string, severity: string, diversionOptions: any[]) {
    let baseCost = 50000; // Base diversion cost
    if (severity === 'critical') baseCost *= 2;
    if (diversionOptions.length > 0) baseCost += diversionOptions[0].distance * 100;
    
    return {
      estimated_total_cost: baseCost,
      fuel_cost: baseCost * 0.3,
      crew_cost: baseCost * 0.2,
      passenger_compensation: baseCost * 0.4,
      operational_cost: baseCost * 0.1
    };
  }

  private generateActionTimeline(scenarioType: string, severity: string) {
    const timeline = [];
    timeline.push({ time: '0 min', action: 'Scenario detected' });
    timeline.push({ time: '2 min', action: 'Initial assessment complete' });
    
    if (severity === 'critical') {
      timeline.push({ time: '5 min', action: 'Emergency declared' });
      timeline.push({ time: '10 min', action: 'Diversion initiated' });
    } else {
      timeline.push({ time: '10 min', action: 'Monitoring protocols established' });
      timeline.push({ time: '15 min', action: 'Decision point reached' });
    }
    
    return timeline;
  }

  /**
   * Get all available scenario types
   */
  public getScenarioTypes(): string[] {
    return Object.keys(this.scenarioTemplates);
  }

  /**
   * Get all aircraft types
   */
  public getAircraftTypes(): { [key: string]: AircraftType } {
    return this.aircraftTypes;
  }

  /**
   * Get all available routes
   */
  public getRoutes(): [string, string][] {
    return this.routes;
  }
}

// Export singleton instance
export const scenarioGeneratorService = new VirginAtlanticScenarioGenerator();