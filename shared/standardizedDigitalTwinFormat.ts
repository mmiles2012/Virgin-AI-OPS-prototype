/**
 * Standardized Digital Twin Format for AINO Aviation Intelligence Platform
 * Universal format for Boeing and Airbus aircraft digital twins
 * Used for: Predictions, Operations Centers, Diversion Engines, What-if Scenarios
 */

/**
 * Standardized Digital Twin Data Structure
 * All aircraft types (Boeing/Airbus) must conform to this format
 */
export interface StandardizedDigitalTwinData {
  // Core Aircraft Identity
  identity: {
    aircraftType: string;              // "Boeing 787-9", "Airbus A350-1000"
    manufacturer: "Boeing" | "Airbus";
    series: string;                    // "787", "A350", "A330"
    variant: string;                   // "787-9", "A350-1000", "A330-300"
    tailNumber?: string;               // Aircraft registration
    fleetId?: string;                  // Fleet identifier
  };

  // Real-time Performance State
  currentState: {
    timestamp: string;                 // ISO timestamp
    location: {
      latitude: number;
      longitude: number;
      altitude: number;                // feet
      groundSpeed: number;             // knots
      heading: number;                 // degrees
      verticalSpeed: number;           // feet/minute
    };
    engines: {
      count: number;
      thrustPercentage: number;        // % of max thrust
      fuelFlowRate: number;            // kg/hour total
      temperature: number;             // °C average
      status: "NORMAL" | "CAUTION" | "WARNING" | "CRITICAL";
      efficiency: number;              // % of optimal
    };
    systems: {
      autopilot: boolean;
      autothrust: boolean;
      flightControlStatus: "NORMAL" | "DEGRADED" | "MANUAL";
      hydraulicStatus: "NORMAL" | "DEGRADED" | "BACKUP";
      electricalStatus: "NORMAL" | "DEGRADED" | "EMERGENCY";
    };
    fuel: {
      totalRemaining: number;          // kg
      totalCapacity: number;           // kg
      remainingPercentage: number;     // %
      consumption: number;             // kg/hour current
      efficiency: number;              // kg/nm
      endurance: number;               // hours remaining
    };
    weather: {
      conditions: string;              // "Clear", "Turbulence", "Icing"
      impact: "NONE" | "MINOR" | "MODERATE" | "SEVERE";
      windComponent: number;           // knots (headwind/tailwind)
      visibilityKm: number;
    };
  };

  // Performance Predictions
  predictions: {
    delayRisk: {
      probability: number;             // 0-1 probability
      expectedDelay: number;           // minutes
      confidence: number;              // 0-1 confidence level
      factors: string[];               // Contributing factors
    };
    fuelPrediction: {
      arrivalFuelKg: number;           // Expected fuel at arrival
      contingencyFuelKg: number;       // Reserve fuel
      diversionCapability: boolean;    // Can divert if needed
      alternateAirports: string[];     // Available alternates
    };
    performanceTrend: {
      efficiency: "IMPROVING" | "STABLE" | "DEGRADING";
      maintenanceAlert: boolean;
      nextServiceHours: number;        // Hours until next service
      healthScore: number;             // 0-100 overall health
    };
  };

  // Operations Center Data
  operationsData: {
    flightPlan: {
      route: string;                   // "LHR-JFK"
      departureTime: string;           // ISO timestamp
      arrivalTime: string;             // ISO timestamp
      flightTime: number;              // minutes
      distance: number;                // nautical miles
      plannedAltitude: number;         // feet
    };
    passengers: {
      total: number;
      checkedIn: number;
      connecting: number;
      specialServices: number;
    };
    cargo: {
      weightKg: number;
      volume: number;                  // cubic meters
      hazardousMaterials: boolean;
    };
    crew: {
      pilots: number;
      cabin: number;
      total: number;
    };
    airport: {
      departure: {
        icao: string;
        gate: string;
        terminal: string;
        stand: string;
      };
      arrival: {
        icao: string;
        gate: string;
        terminal: string;
        stand: string;
      };
    };
  };

  // Diversion Engine Data
  diversionCapabilities: {
    currentRange: number;              // nm remaining range
    suitableAirports: Array<{
      icao: string;
      name: string;
      distance: number;                // nm
      suitability: "EXCELLENT" | "GOOD" | "ADEQUATE" | "POOR";
      runwayLength: number;            // feet
      fuelAvailable: boolean;
      maintenanceCapable: boolean;
    }>;
    diversionTriggers: {
      fuelMinimum: number;             // kg
      weatherMinimum: string;          // conditions
      technicalLimits: string[];       // system limitations
    };
    emergencyProcedures: {
      medicalDiversion: boolean;
      technicalDiversion: boolean;
      securityDiversion: boolean;
    };
  };

  // What-if Scenario Data
  scenarioCapabilities: {
    routeAlternatives: Array<{
      route: string;
      addedTime: number;               // minutes
      addedFuel: number;               // kg
      addedCost: number;               // USD
      feasible: boolean;
    }>;
    speedAdjustments: {
      minSpeed: number;                // knots
      maxSpeed: number;                // knots
      economySpeed: number;            // knots (most efficient)
      timeSpeed: number;               // knots (fastest practical)
    };
    altitudeOptions: {
      optimal: number;                 // feet
      maximum: number;                 // feet
      minimum: number;                 // feet
      stepClimbs: number[];            // available step climb altitudes
    };
    fuelScenarios: {
      minimum: number;                 // kg required
      optimal: number;                 // kg recommended
      maximum: number;                 // kg capacity
      contingency: number;             // kg for emergencies
    };
  };

  // Cost Analysis
  economics: {
    operationalCost: {
      perHour: number;                 // USD
      perNauticalMile: number;         // USD
      perPassenger: number;            // USD
      total: number;                   // USD total flight cost
    };
    fuelCost: {
      consumed: number;                // USD
      remaining: number;               // USD value
      efficiency: number;              // USD per nm
    };
    delayImpact: {
      eu261Risk: number;               // EUR potential compensation
      connectionRisk: number;          // Number of affected passengers
      reputationCost: number;          // USD estimated brand impact
    };
    maintenanceCost: {
      scheduled: number;               // USD next service
      predictive: number;              // USD estimated from health data
      emergency: number;               // USD if failure occurs
    };
  };

  // ML Model Outputs
  mlPredictions: {
    delayProbability: number;          // 0-1 probability
    delayMinutes: number;              // Expected delay
    connectionImpact: number;          // Affected connections
    fuelEfficiency: number;            // Predicted consumption
    maintenanceRisk: number;           // 0-1 risk score
    weatherImpact: number;             // -1 to 1 impact score
    confidence: number;                // 0-1 model confidence
    lastUpdated: string;               // ISO timestamp
  };

  // Alerts and Notifications
  alerts: Array<{
    id: string;
    type: "OPERATIONAL" | "MAINTENANCE" | "WEATHER" | "FUEL" | "DELAY" | "EMERGENCY";
    priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    message: string;
    timestamp: string;
    acknowledged: boolean;
    actionRequired: boolean;
  }>;

  // Data Quality and Validation
  dataQuality: {
    completeness: number;              // 0-1 data completeness
    freshness: number;                 // seconds since last update
    accuracy: number;                  // 0-1 estimated accuracy
    sources: string[];                 // Data source systems
    validationStatus: "VALID" | "STALE" | "INVALID";
  };
}

/**
 * Standardized Digital Twin Service Interface
 * All aircraft-specific services must implement this interface
 */
export interface IStandardizedDigitalTwinService {
  /**
   * Get standardized digital twin data for an aircraft
   */
  getStandardizedDigitalTwin(aircraftId: string): Promise<StandardizedDigitalTwinData>;

  /**
   * Update real-time performance data
   */
  updatePerformanceData(aircraftId: string, performanceData: any): Promise<void>;

  /**
   * Run predictive analysis
   */
  runPredictiveAnalysis(aircraftId: string): Promise<StandardizedDigitalTwinData['predictions']>;

  /**
   * Calculate diversion options
   */
  calculateDiversionOptions(aircraftId: string): Promise<StandardizedDigitalTwinData['diversionCapabilities']>;

  /**
   * Run what-if scenarios
   */
  runWhatIfScenarios(aircraftId: string, scenarios: any[]): Promise<StandardizedDigitalTwinData['scenarioCapabilities']>;

  /**
   * Get cost analysis
   */
  getCostAnalysis(aircraftId: string): Promise<StandardizedDigitalTwinData['economics']>;

  /**
   * Get ML predictions
   */
  getMLPredictions(aircraftId: string): Promise<StandardizedDigitalTwinData['mlPredictions']>;

  /**
   * Get active alerts
   */
  getActiveAlerts(aircraftId: string): Promise<StandardizedDigitalTwinData['alerts']>;

  /**
   * Validate data quality
   */
  validateDataQuality(aircraftId: string): Promise<StandardizedDigitalTwinData['dataQuality']>;
}

/**
 * Digital Twin Presentation Utilities
 */
export class DigitalTwinPresentationUtils {
  /**
   * Format performance data for operations center display
   */
  static formatForOperationsCenter(digitalTwin: StandardizedDigitalTwinData): any {
    return {
      header: {
        aircraftType: digitalTwin.identity.aircraftType,
        flightRoute: digitalTwin.operationsData.flightPlan.route,
        status: digitalTwin.currentState.systems.flightControlStatus,
        eta: digitalTwin.operationsData.flightPlan.arrivalTime
      },
      performance: {
        altitude: `${digitalTwin.currentState.location.altitude.toLocaleString()} ft`,
        speed: `${digitalTwin.currentState.location.groundSpeed} kts`,
        fuel: `${digitalTwin.currentState.fuel.remainingPercentage}% (${digitalTwin.currentState.fuel.totalRemaining.toLocaleString()} kg)`,
        engines: `${digitalTwin.currentState.engines.thrustPercentage}% thrust`
      },
      predictions: {
        delayRisk: `${(digitalTwin.predictions.delayRisk.probability * 100).toFixed(1)}%`,
        expectedDelay: `${digitalTwin.predictions.delayRisk.expectedDelay} min`,
        fuelAtArrival: `${digitalTwin.predictions.fuelPrediction.arrivalFuelKg.toLocaleString()} kg`
      },
      alerts: digitalTwin.alerts.filter(alert => alert.priority === 'HIGH' || alert.priority === 'CRITICAL')
    };
  }

  /**
   * Format data for diversion engine
   */
  static formatForDiversionEngine(digitalTwin: StandardizedDigitalTwinData): any {
    return {
      currentCapability: {
        range: digitalTwin.diversionCapabilities.currentRange,
        suitableAirports: digitalTwin.diversionCapabilities.suitableAirports.length,
        emergencyCapable: digitalTwin.diversionCapabilities.emergencyProcedures.medicalDiversion
      },
      topAlternates: digitalTwin.diversionCapabilities.suitableAirports
        .filter(airport => airport.suitability === 'EXCELLENT' || airport.suitability === 'GOOD')
        .slice(0, 3),
      constraints: {
        fuelMinimum: digitalTwin.diversionCapabilities.diversionTriggers.fuelMinimum,
        weatherMinimum: digitalTwin.diversionCapabilities.diversionTriggers.weatherMinimum,
        technicalLimits: digitalTwin.diversionCapabilities.diversionTriggers.technicalLimits
      }
    };
  }

  /**
   * Format data for what-if scenarios
   */
  static formatForWhatIfScenarios(digitalTwin: StandardizedDigitalTwinData): any {
    return {
      routeOptions: digitalTwin.scenarioCapabilities.routeAlternatives.map(route => ({
        route: route.route,
        impact: `+${route.addedTime} min, +${route.addedFuel} kg, +$${route.addedCost}`,
        feasible: route.feasible
      })),
      speedOptions: {
        economy: `${digitalTwin.scenarioCapabilities.speedAdjustments.economySpeed} kts (most efficient)`,
        time: `${digitalTwin.scenarioCapabilities.speedAdjustments.timeSpeed} kts (fastest)`,
        range: `${digitalTwin.scenarioCapabilities.speedAdjustments.minSpeed}-${digitalTwin.scenarioCapabilities.speedAdjustments.maxSpeed} kts`
      },
      altitudeOptions: {
        optimal: `${digitalTwin.scenarioCapabilities.altitudeOptions.optimal.toLocaleString()} ft`,
        stepClimbs: digitalTwin.scenarioCapabilities.altitudeOptions.stepClimbs.map(alt => `${alt.toLocaleString()} ft`)
      },
      fuelScenarios: {
        minimum: `${digitalTwin.scenarioCapabilities.fuelScenarios.minimum.toLocaleString()} kg (required)`,
        optimal: `${digitalTwin.scenarioCapabilities.fuelScenarios.optimal.toLocaleString()} kg (recommended)`,
        contingency: `${digitalTwin.scenarioCapabilities.fuelScenarios.contingency.toLocaleString()} kg (emergency)`
      }
    };
  }

  /**
   * Format data for ML predictions display
   */
  static formatForMLPredictions(digitalTwin: StandardizedDigitalTwinData): any {
    return {
      delayPrediction: {
        probability: `${(digitalTwin.mlPredictions.delayProbability * 100).toFixed(1)}%`,
        expectedDelay: `${digitalTwin.mlPredictions.delayMinutes} minutes`,
        confidence: `${(digitalTwin.mlPredictions.confidence * 100).toFixed(1)}%`
      },
      fuelPrediction: {
        efficiency: `${digitalTwin.mlPredictions.fuelEfficiency.toFixed(1)} kg/nm`,
        trend: digitalTwin.predictions.performanceTrend.efficiency
      },
      maintenanceRisk: {
        score: `${(digitalTwin.mlPredictions.maintenanceRisk * 100).toFixed(1)}%`,
        nextService: `${digitalTwin.predictions.performanceTrend.nextServiceHours} hours`
      },
      weatherImpact: {
        score: digitalTwin.mlPredictions.weatherImpact > 0 ? 
          `+${(digitalTwin.mlPredictions.weatherImpact * 100).toFixed(1)}% (beneficial)` :
          `${(digitalTwin.mlPredictions.weatherImpact * 100).toFixed(1)}% (adverse)`
      },
      lastUpdated: digitalTwin.mlPredictions.lastUpdated
    };
  }

  /**
   * Get color coding for status indicators
   */
  static getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'normal': case 'excellent': case 'good': return 'green';
      case 'caution': case 'degraded': case 'adequate': return 'yellow';
      case 'warning': case 'poor': return 'orange';
      case 'critical': case 'emergency': return 'red';
      default: return 'gray';
    }
  }

  /**
   * Get priority icon for alerts
   */
  static getAlertIcon(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'low': return '🔵';
      case 'medium': return '🟡';
      case 'high': return '🟠';
      case 'critical': return '🔴';
      default: return '⚪';
    }
  }
}

/**
 * Digital Twin Data Validation
 */
export class DigitalTwinValidator {
  /**
   * Validate standardized digital twin data structure
   */
  static validate(data: StandardizedDigitalTwinData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Validate required fields
    if (!data.identity?.aircraftType) errors.push('Missing aircraft type');
    if (!data.identity?.manufacturer) errors.push('Missing manufacturer');
    if (!data.currentState?.timestamp) errors.push('Missing timestamp');
    if (!data.currentState?.location) errors.push('Missing location data');
    if (!data.operationsData?.flightPlan) errors.push('Missing flight plan data');

    // Validate data ranges
    if (data.currentState?.location?.altitude && (data.currentState.location.altitude < 0 || data.currentState.location.altitude > 50000)) {
      errors.push('Invalid altitude range');
    }

    if (data.currentState?.fuel?.remainingPercentage && (data.currentState.fuel.remainingPercentage < 0 || data.currentState.fuel.remainingPercentage > 100)) {
      errors.push('Invalid fuel percentage');
    }

    // Validate predictions
    if (data.predictions?.delayRisk?.probability && (data.predictions.delayRisk.probability < 0 || data.predictions.delayRisk.probability > 1)) {
      errors.push('Invalid delay probability range');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate data freshness
   */
  static isDataFresh(data: StandardizedDigitalTwinData, maxAgeMinutes: number = 5): boolean {
    const now = new Date();
    const dataTime = new Date(data.currentState.timestamp);
    const ageMinutes = (now.getTime() - dataTime.getTime()) / (1000 * 60);
    return ageMinutes <= maxAgeMinutes;
  }
}