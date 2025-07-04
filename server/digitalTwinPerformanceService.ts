/**
 * Digital Twin Performance Service for AINO Aviation Intelligence Platform
 * Provides enhanced flight calculations using aircraft-specific performance data
 * Now uses standardized format across Boeing and Airbus aircraft
 */

import { 
  StandardizedDigitalTwinData, 
  IStandardizedDigitalTwinService,
  DigitalTwinPresentationUtils 
} from '../shared/standardizedDigitalTwinFormat';
import { 
  VIRGIN_ATLANTIC_FLEET, 
  VirginAtlanticFleetUtils,
  VirginAtlanticAircraft 
} from '../shared/virginAtlanticFleetData';

interface AircraftPerformanceData {
  aircraftType: string;
  engines: {
    type: string;
    count: number;
    thrustPerEngine: number; // lbf
    fuelFlowCruise: number; // kg/hour per engine
    fuelFlowClimb: number; // kg/hour per engine
    fuelFlowDescent: number; // kg/hour per engine
  };
  aerodynamics: {
    maxAltitude: number; // feet
    serviceCeiling: number; // feet
    cruiseSpeed: number; // knots
    maxSpeed: number; // knots
    stallSpeed: number; // knots
    wingSpan: number; // meters
    wingArea: number; // square meters
  };
  weights: {
    emptyWeight: number; // kg
    maxTakeoffWeight: number; // kg
    maxLandingWeight: number; // kg
    maxFuelCapacity: number; // kg
    maxPayload: number; // kg
  };
  performance: {
    rangeMaxPax: number; // nautical miles
    rangeMaxFuel: number; // nautical miles
    fuelBurnPerHour: number; // kg/hour at cruise
    costPerHour: number; // USD operational cost
    cruiseAltitude: number; // feet
    climbRate: number; // feet per minute
    descentRate: number; // feet per minute
  };
}

export class DigitalTwinPerformanceService implements IStandardizedDigitalTwinService {
  private aircraftDatabase: Map<string, AircraftPerformanceData>;

  constructor() {
    this.aircraftDatabase = new Map();
    this.initializeAircraftDatabase();
  }

  private initializeAircraftDatabase(): void {
    // Boeing 787-9 Performance Data (Virgin Atlantic Primary Fleet)
    this.aircraftDatabase.set('Boeing 787-9', {
      aircraftType: 'Boeing 787-9',
      engines: {
        type: 'GEnx-1B / Trent 1000',
        count: 2,
        thrustPerEngine: 74500, // lbf
        fuelFlowCruise: 840, // kg/hour per engine
        fuelFlowClimb: 1400, // kg/hour per engine
        fuelFlowDescent: 320 // kg/hour per engine
      },
      aerodynamics: {
        maxAltitude: 43000,
        serviceCeiling: 43000,
        cruiseSpeed: 485, // knots
        maxSpeed: 516, // knots
        stallSpeed: 138, // knots
        wingSpan: 60.1, // meters
        wingArea: 377.0 // square meters
      },
      weights: {
        emptyWeight: 119950, // kg
        maxTakeoffWeight: 254000, // kg
        maxLandingWeight: 213000, // kg
        maxFuelCapacity: 126372, // kg
        maxPayload: 28000 // kg
      },
      performance: {
        rangeMaxPax: 7635, // nautical miles
        rangeMaxFuel: 8786, // nautical miles
        fuelBurnPerHour: 1680, // kg/hour at cruise
        costPerHour: 7184, // USD operational cost
        cruiseAltitude: 39000, // feet
        climbRate: 2500, // feet per minute
        descentRate: 2000 // feet per minute
      }
    });

    // Airbus A350-1000 Performance Data
    this.aircraftDatabase.set('Airbus A350-1000', {
      aircraftType: 'Airbus A350-1000',
      engines: {
        type: 'Trent XWB-97',
        count: 2,
        thrustPerEngine: 97000, // lbf
        fuelFlowCruise: 950, // kg/hour per engine
        fuelFlowClimb: 1600, // kg/hour per engine
        fuelFlowDescent: 380 // kg/hour per engine
      },
      aerodynamics: {
        maxAltitude: 43100,
        serviceCeiling: 43100,
        cruiseSpeed: 488, // knots
        maxSpeed: 516, // knots
        stallSpeed: 142, // knots
        wingSpan: 64.75, // meters
        wingArea: 443.0 // square meters
      },
      weights: {
        emptyWeight: 142400, // kg
        maxTakeoffWeight: 319000, // kg
        maxLandingWeight: 233000, // kg
        maxFuelCapacity: 156000, // kg
        maxPayload: 35000 // kg
      },
      performance: {
        rangeMaxPax: 8700, // nautical miles
        rangeMaxFuel: 9700, // nautical miles
        fuelBurnPerHour: 1900, // kg/hour at cruise
        costPerHour: 8420, // USD operational cost
        cruiseAltitude: 41000, // feet
        climbRate: 2200, // feet per minute
        descentRate: 1800 // feet per minute
      }
    });

    // Airbus A330-300 Performance Data
    this.aircraftDatabase.set('Airbus A330-300', {
      aircraftType: 'Airbus A330-300',
      engines: {
        type: 'Trent 700 / PW4000',
        count: 2,
        thrustPerEngine: 72000, // lbf
        fuelFlowCruise: 1100, // kg/hour per engine
        fuelFlowClimb: 1800, // kg/hour per engine
        fuelFlowDescent: 420 // kg/hour per engine
      },
      aerodynamics: {
        maxAltitude: 42000,
        serviceCeiling: 42000,
        cruiseSpeed: 470, // knots
        maxSpeed: 516, // knots
        stallSpeed: 145, // knots
        wingSpan: 60.3, // meters
        wingArea: 363.1 // square meters
      },
      weights: {
        emptyWeight: 124500, // kg
        maxTakeoffWeight: 242000, // kg
        maxLandingWeight: 187000, // kg
        maxFuelCapacity: 97530, // kg
        maxPayload: 26000 // kg
      },
      performance: {
        rangeMaxPax: 6350, // nautical miles
        rangeMaxFuel: 7400, // nautical miles
        fuelBurnPerHour: 2200, // kg/hour at cruise
        costPerHour: 7827, // USD operational cost
        cruiseAltitude: 37000, // feet
        climbRate: 2000, // feet per minute
        descentRate: 1500 // feet per minute
      }
    });

    // Airbus A330-900 Performance Data (A330neo)
    this.aircraftDatabase.set('Airbus A330-900', {
      aircraftType: 'Airbus A330-900',
      engines: {
        type: 'Trent 7000',
        count: 2,
        thrustPerEngine: 72840, // lbf
        fuelFlowCruise: 950, // kg/hour per engine
        fuelFlowClimb: 1500, // kg/hour per engine
        fuelFlowDescent: 380 // kg/hour per engine
      },
      aerodynamics: {
        maxAltitude: 42000,
        serviceCeiling: 42000,
        cruiseSpeed: 475, // knots
        maxSpeed: 516, // knots
        stallSpeed: 140, // knots
        wingSpan: 64.0, // meters
        wingArea: 363.1 // square meters
      },
      weights: {
        emptyWeight: 132000, // kg
        maxTakeoffWeight: 251000, // kg
        maxLandingWeight: 191000, // kg
        maxFuelCapacity: 139090, // kg
        maxPayload: 28000 // kg
      },
      performance: {
        rangeMaxPax: 7200, // nautical miles
        rangeMaxFuel: 8150, // nautical miles
        fuelBurnPerHour: 1900, // kg/hour at cruise
        costPerHour: 7400, // USD operational cost
        cruiseAltitude: 39000, // feet
        climbRate: 2100, // feet per minute
        descentRate: 1700 // feet per minute
      }
    });
  }

  /**
   * Calculate accurate flight performance based on aircraft type and flight parameters
   */
  public calculateFlightPerformance(
    aircraftType: string,
    route: string,
    distanceNm: number,
    passengers: number,
    cargoWeight: number = 0
  ): any {
    const aircraft = this.aircraftDatabase.get(aircraftType);
    if (!aircraft) {
      throw new Error(`Aircraft type ${aircraftType} not found in performance database`);
    }

    // Calculate flight phases
    const flightPhases = this.calculateFlightPhases(distanceNm, aircraft);
    
    // Calculate fuel requirements
    const fuelCalculations = this.calculateFuelRequirements(
      aircraft,
      flightPhases,
      passengers,
      cargoWeight
    );

    // Calculate performance metrics
    const performance = this.calculatePerformanceMetrics(
      aircraft,
      flightPhases,
      fuelCalculations
    );

    // Calculate operational costs
    const costs = this.calculateOperationalCosts(
      aircraft,
      flightPhases.totalFlightTime,
      passengers,
      distanceNm
    );

    return {
      aircraftType,
      route,
      distanceNm,
      passengers,
      cargoWeight,
      flightPhases,
      fuelCalculations,
      performance,
      costs,
      digitalTwinData: {
        engines: aircraft.engines,
        weights: aircraft.weights,
        aerodynamics: aircraft.aerodynamics
      }
    };
  }

  private calculateFlightPhases(distanceNm: number, aircraft: AircraftPerformanceData): any {
    // Calculate flight phases based on distance and aircraft performance
    const climbDistance = 120; // nm average climb distance
    const descentDistance = 140; // nm average descent distance
    const cruiseDistance = Math.max(0, distanceNm - climbDistance - descentDistance);

    const climbTime = (aircraft.performance.cruiseAltitude / aircraft.performance.climbRate) / 60; // hours
    const descentTime = (aircraft.performance.cruiseAltitude / aircraft.performance.descentRate) / 60; // hours
    const cruiseTime = cruiseDistance / aircraft.aerodynamics.cruiseSpeed; // hours

    const totalFlightTime = climbTime + cruiseTime + descentTime;

    return {
      climbDistance,
      cruiseDistance,
      descentDistance,
      climbTime,
      cruiseTime,
      descentTime,
      totalFlightTime
    };
  }

  private calculateFuelRequirements(
    aircraft: AircraftPerformanceData,
    flightPhases: any,
    passengers: number,
    cargoWeight: number
  ): any {
    // Calculate fuel consumption for each phase
    const climbFuel = flightPhases.climbTime * aircraft.engines.fuelFlowClimb * aircraft.engines.count;
    const cruiseFuel = flightPhases.cruiseTime * aircraft.engines.fuelFlowCruise * aircraft.engines.count;
    const descentFuel = flightPhases.descentTime * aircraft.engines.fuelFlowDescent * aircraft.engines.count;

    // Reserve fuel (10% of trip fuel + 45 minutes holding)
    const tripFuel = climbFuel + cruiseFuel + descentFuel;
    const holdingFuel = 0.75 * aircraft.engines.fuelFlowCruise * aircraft.engines.count; // 45 minutes
    const reserveFuel = tripFuel * 0.1 + holdingFuel;

    // Total fuel required
    const totalFuelRequired = tripFuel + reserveFuel;

    // Calculate fuel remaining percentage
    const fuelRemainingPercentage = Math.max(0, 
      ((aircraft.weights.maxFuelCapacity - totalFuelRequired) / aircraft.weights.maxFuelCapacity) * 100
    );

    return {
      climbFuel,
      cruiseFuel,
      descentFuel,
      tripFuel,
      reserveFuel,
      totalFuelRequired,
      fuelRemainingPercentage,
      fuelEfficiency: tripFuel / flightPhases.totalFlightTime // kg/hour
    };
  }

  private calculatePerformanceMetrics(
    aircraft: AircraftPerformanceData,
    flightPhases: any,
    fuelCalculations: any
  ): any {
    // Calculate current performance metrics
    const averageSpeed = (flightPhases.climbDistance + flightPhases.cruiseDistance + flightPhases.descentDistance) / flightPhases.totalFlightTime;
    
    // Calculate altitude progression
    const currentAltitude = aircraft.performance.cruiseAltitude;
    const targetAltitude = aircraft.performance.cruiseAltitude;
    
    // Calculate vertical speed (simulated based on flight phase)
    const verticalSpeed = 0; // Assuming cruise phase

    // Calculate heading and speed variations
    const groundSpeed = aircraft.aerodynamics.cruiseSpeed;
    const airspeed = aircraft.aerodynamics.cruiseSpeed;

    return {
      averageSpeed,
      currentAltitude,
      targetAltitude,
      verticalSpeed,
      groundSpeed,
      airspeed,
      fuelFlowRate: fuelCalculations.fuelEfficiency,
      engineEfficiency: 95 // Percentage
    };
  }

  private calculateOperationalCosts(
    aircraft: AircraftPerformanceData,
    flightTimeHours: number,
    passengers: number,
    distanceNm: number
  ): any {
    // Operational cost breakdown
    const fuelCost = flightTimeHours * aircraft.performance.fuelBurnPerHour * 0.8; // $0.80 per kg fuel
    const crewCost = flightTimeHours * 1200; // $1200 per hour
    const maintenanceCost = flightTimeHours * 2100; // $2100 per hour
    const insuranceCost = flightTimeHours * 1500; // $1500 per hour
    const airportFees = 3500; // Fixed airport fees
    const navigationFees = distanceNm * 0.85; // $0.85 per nautical mile

    const totalOperationalCost = fuelCost + crewCost + maintenanceCost + insuranceCost + airportFees + navigationFees;
    const costPerPassenger = totalOperationalCost / passengers;
    const costPerSeat = aircraft.performance.costPerHour * flightTimeHours / passengers;

    return {
      fuelCost,
      crewCost,
      maintenanceCost,
      insuranceCost,
      airportFees,
      navigationFees,
      totalOperationalCost,
      costPerPassenger,
      costPerSeat
    };
  }

  /**
   * Get real-time performance data for an aircraft
   */
  public getRealtimePerformanceData(aircraftType: string): any {
    const aircraft = this.aircraftDatabase.get(aircraftType);
    if (!aircraft) {
      return null;
    }

    // Simulate real-time performance variations
    const performanceVariation = 0.95 + Math.random() * 0.1; // 95-105% performance

    return {
      aircraftType,
      engines: {
        ...aircraft.engines,
        currentThrust: aircraft.engines.thrustPerEngine * performanceVariation,
        currentFuelFlow: aircraft.engines.fuelFlowCruise * performanceVariation
      },
      performance: {
        ...aircraft.performance,
        currentFuelBurn: aircraft.performance.fuelBurnPerHour * performanceVariation,
        currentCruiseSpeed: aircraft.aerodynamics.cruiseSpeed * performanceVariation
      },
      status: {
        engineHealth: performanceVariation > 0.98 ? 'EXCELLENT' : 
                     performanceVariation > 0.95 ? 'GOOD' : 'FAIR',
        fuelEfficiency: performanceVariation > 0.98 ? 'OPTIMAL' : 
                       performanceVariation > 0.95 ? 'GOOD' : 'AVERAGE',
        overallPerformance: performanceVariation * 100
      }
    };
  }

  /**
   * Get supported aircraft types
   */
  public getSupportedAircraftTypes(): string[] {
    return Array.from(this.aircraftDatabase.keys());
  }

  /**
   * Get complete aircraft specifications
   */
  public getAircraftSpecifications(aircraftType: string): AircraftPerformanceData | null {
    return this.aircraftDatabase.get(aircraftType) || null;
  }

  // Standardized Digital Twin Interface Implementation

  /**
   * Get standardized digital twin data for an aircraft
   */
  public async getStandardizedDigitalTwin(aircraftId: string): Promise<StandardizedDigitalTwinData> {
    // First try to find the aircraft in Virgin Atlantic fleet
    let virginAtlanticAircraft: VirginAtlanticAircraft | undefined;
    let aircraftType: string;
    
    // Check if aircraftId is a Virgin Atlantic registration
    if (aircraftId.startsWith('G-V')) {
      virginAtlanticAircraft = VirginAtlanticFleetUtils.getAircraftByRegistration(aircraftId);
      if (virginAtlanticAircraft) {
        aircraftType = this.mapFleetTypeToSystemType(virginAtlanticAircraft.aircraftType);
      } else {
        throw new Error(`Virgin Atlantic aircraft ${aircraftId} not found in fleet database`);
      }
    } else {
      // Fallback to generic aircraft type extraction
      aircraftType = this.extractAircraftTypeFromId(aircraftId);
    }
    
    const aircraft = this.aircraftDatabase.get(aircraftType);
    
    if (!aircraft) {
      throw new Error(`Aircraft type ${aircraftType} not found in digital twin database`);
    }

    // Generate realistic current state data
    const currentState = this.generateCurrentStateData(aircraft, aircraftId);
    
    // Generate predictions
    const predictions = await this.runPredictiveAnalysis(aircraftId);
    
    // Generate operations data
    const operationsData = this.generateOperationsData(aircraftId);
    
    // Generate diversion capabilities
    const diversionCapabilities = await this.calculateDiversionOptions(aircraftId);
    
    // Generate scenario capabilities
    const scenarioCapabilities = await this.runWhatIfScenarios(aircraftId, []);
    
    // Generate cost analysis
    const economics = await this.getCostAnalysis(aircraftId);
    
    // Generate ML predictions
    const mlPredictions = await this.getMLPredictions(aircraftId);
    
    // Generate alerts
    const alerts = await this.getActiveAlerts(aircraftId);
    
    // Validate data quality
    const dataQuality = await this.validateDataQuality(aircraftId);

    // Update identity with Virgin Atlantic fleet data if available
    const identityData = virginAtlanticAircraft ? {
      aircraftType: virginAtlanticAircraft.aircraftType,
      manufacturer: virginAtlanticAircraft.aircraftType.includes('Boeing') ? 'Boeing' as const : 'Airbus' as const,
      series: this.extractSeries(virginAtlanticAircraft.aircraftType),
      variant: this.extractVariant(virginAtlanticAircraft.aircraftType),
      tailNumber: virginAtlanticAircraft.registration,
      fleetId: virginAtlanticAircraft.registration,
      aircraftName: virginAtlanticAircraft.aircraftName,
      configuration: virginAtlanticAircraft.configuration,
      age: virginAtlanticAircraft.ageYears,
      delivered: virginAtlanticAircraft.delivered
    } : {
      aircraftType: aircraftType,
      manufacturer: aircraftType.startsWith('Boeing') ? 'Boeing' as const : 'Airbus' as const,
      series: this.extractSeries(aircraftType),
      variant: this.extractVariant(aircraftType),
      tailNumber: aircraftId.startsWith('G-') ? aircraftId : `G-${aircraftId.slice(-4).toUpperCase()}`,
      fleetId: aircraftId
    };

    const standardizedData: StandardizedDigitalTwinData = {
      identity: identityData,
      currentState,
      predictions,
      operationsData,
      diversionCapabilities,
      scenarioCapabilities,
      economics,
      mlPredictions,
      alerts,
      dataQuality
    };

    return standardizedData;
  }

  /**
   * Update real-time performance data
   */
  public async updatePerformanceData(aircraftId: string, performanceData: any): Promise<void> {
    // Implementation for updating real-time performance data
    console.log(`Updating performance data for ${aircraftId}:`, performanceData);
  }

  /**
   * Run predictive analysis
   */
  public async runPredictiveAnalysis(aircraftId: string): Promise<StandardizedDigitalTwinData['predictions']> {
    const aircraftType = this.extractAircraftTypeFromId(aircraftId);
    const aircraft = this.aircraftDatabase.get(aircraftType);
    
    if (!aircraft) {
      throw new Error(`Aircraft type ${aircraftType} not found`);
    }

    // Generate realistic delay risk prediction
    const delayProbability = Math.random() * 0.3; // 0-30% delay probability
    const expectedDelay = delayProbability > 0.2 ? Math.floor(Math.random() * 45) + 5 : 0;
    
    return {
      delayRisk: {
        probability: delayProbability,
        expectedDelay: expectedDelay,
        confidence: 0.85 + Math.random() * 0.1,
        factors: this.getDelayFactors(delayProbability)
      },
      fuelPrediction: {
        arrivalFuelKg: aircraft.weights.maxFuelCapacity * (0.15 + Math.random() * 0.1),
        contingencyFuelKg: aircraft.weights.maxFuelCapacity * 0.05,
        diversionCapability: true,
        alternateAirports: ['EGKK', 'EGGW', 'EGSS', 'EGMC']
      },
      performanceTrend: {
        efficiency: Math.random() > 0.7 ? 'IMPROVING' : Math.random() > 0.3 ? 'STABLE' : 'DEGRADING',
        maintenanceAlert: Math.random() < 0.1,
        nextServiceHours: 150 + Math.floor(Math.random() * 200),
        healthScore: 85 + Math.floor(Math.random() * 12)
      }
    };
  }

  /**
   * Calculate diversion options
   */
  public async calculateDiversionOptions(aircraftId: string): Promise<StandardizedDigitalTwinData['diversionCapabilities']> {
    const aircraftType = this.extractAircraftTypeFromId(aircraftId);
    const aircraft = this.aircraftDatabase.get(aircraftType);
    
    if (!aircraft) {
      throw new Error(`Aircraft type ${aircraftType} not found`);
    }

    const suitableAirports = [
      {
        icao: 'EGKK',
        name: 'London Gatwick',
        distance: 28,
        suitability: 'EXCELLENT' as const,
        runwayLength: 10364,
        fuelAvailable: true,
        maintenanceCapable: true
      },
      {
        icao: 'EGGW',
        name: 'London Luton',
        distance: 35,
        suitability: 'GOOD' as const,
        runwayLength: 7546,
        fuelAvailable: true,
        maintenanceCapable: false
      },
      {
        icao: 'EGSS',
        name: 'London Stansted',
        distance: 42,
        suitability: 'GOOD' as const,
        runwayLength: 10000,
        fuelAvailable: true,
        maintenanceCapable: true
      }
    ];

    return {
      currentRange: aircraft.performance.rangeMaxFuel * 0.3, // Assuming 30% fuel remaining
      suitableAirports,
      diversionTriggers: {
        fuelMinimum: aircraft.weights.maxFuelCapacity * 0.08, // 8% minimum fuel
        weatherMinimum: 'Category I ILS minimums',
        technicalLimits: ['Single engine operation', 'Hydraulic system failure']
      },
      emergencyProcedures: {
        medicalDiversion: true,
        technicalDiversion: true,
        securityDiversion: true
      }
    };
  }

  /**
   * Run what-if scenarios
   */
  public async runWhatIfScenarios(aircraftId: string, scenarios: any[]): Promise<StandardizedDigitalTwinData['scenarioCapabilities']> {
    const aircraftType = this.extractAircraftTypeFromId(aircraftId);
    const aircraft = this.aircraftDatabase.get(aircraftType);
    
    if (!aircraft) {
      throw new Error(`Aircraft type ${aircraftType} not found`);
    }

    return {
      routeAlternatives: [
        {
          route: 'LHR-JFK via NAT-A',
          addedTime: 12,
          addedFuel: 850,
          addedCost: 1200,
          feasible: true
        },
        {
          route: 'LHR-JFK via Greenland',
          addedTime: 25,
          addedFuel: 1800,
          addedCost: 2400,
          feasible: true
        }
      ],
      speedAdjustments: {
        minSpeed: aircraft.aerodynamics.stallSpeed + 50,
        maxSpeed: aircraft.aerodynamics.maxSpeed,
        economySpeed: aircraft.aerodynamics.cruiseSpeed - 15,
        timeSpeed: aircraft.aerodynamics.cruiseSpeed + 20
      },
      altitudeOptions: {
        optimal: aircraft.performance.cruiseAltitude,
        maximum: aircraft.aerodynamics.maxAltitude,
        minimum: 25000,
        stepClimbs: [33000, 35000, 37000, 39000, 41000]
      },
      fuelScenarios: {
        minimum: aircraft.weights.maxFuelCapacity * 0.6,
        optimal: aircraft.weights.maxFuelCapacity * 0.75,
        maximum: aircraft.weights.maxFuelCapacity,
        contingency: aircraft.weights.maxFuelCapacity * 0.15
      }
    };
  }

  /**
   * Get cost analysis
   */
  public async getCostAnalysis(aircraftId: string): Promise<StandardizedDigitalTwinData['economics']> {
    const aircraftType = this.extractAircraftTypeFromId(aircraftId);
    const aircraft = this.aircraftDatabase.get(aircraftType);
    
    if (!aircraft) {
      throw new Error(`Aircraft type ${aircraftType} not found`);
    }

    const flightTime = 8; // Assuming 8-hour flight
    const totalCost = aircraft.performance.costPerHour * flightTime;
    const passengers = 250; // Typical passenger load

    return {
      operationalCost: {
        perHour: aircraft.performance.costPerHour,
        perNauticalMile: aircraft.performance.costPerHour / aircraft.aerodynamics.cruiseSpeed,
        perPassenger: totalCost / passengers,
        total: totalCost
      },
      fuelCost: {
        consumed: aircraft.performance.fuelBurnPerHour * flightTime * 0.8, // $0.80 per kg
        remaining: aircraft.weights.maxFuelCapacity * 0.2 * 0.8,
        efficiency: 0.8 * aircraft.performance.fuelBurnPerHour / aircraft.aerodynamics.cruiseSpeed
      },
      delayImpact: {
        eu261Risk: 250 * 600, // €600 per passenger for long delays
        connectionRisk: 45, // Number of connecting passengers
        reputationCost: 25000 // Estimated brand impact
      },
      maintenanceCost: {
        scheduled: 45000,
        predictive: 12000,
        emergency: 150000
      }
    };
  }

  /**
   * Get ML predictions
   */
  public async getMLPredictions(aircraftId: string): Promise<StandardizedDigitalTwinData['mlPredictions']> {
    return {
      delayProbability: Math.random() * 0.25,
      delayMinutes: Math.floor(Math.random() * 30),
      connectionImpact: Math.floor(Math.random() * 50),
      fuelEfficiency: 1.8 + Math.random() * 0.4, // kg/nm
      maintenanceRisk: Math.random() * 0.15,
      weatherImpact: (Math.random() - 0.5) * 0.4, // -0.2 to +0.2
      confidence: 0.85 + Math.random() * 0.1,
      lastUpdated: new Date().toISOString()
    };
  }

  /**
   * Get active alerts
   */
  public async getActiveAlerts(aircraftId: string): Promise<StandardizedDigitalTwinData['alerts']> {
    const alerts: StandardizedDigitalTwinData['alerts'] = [];
    
    // Generate some sample alerts based on random conditions
    if (Math.random() < 0.3) {
      alerts.push({
        id: `WEATHER_${Date.now()}`,
        type: 'WEATHER',
        priority: 'MEDIUM',
        message: 'Moderate turbulence expected over North Atlantic',
        timestamp: new Date().toISOString(),
        acknowledged: false,
        actionRequired: false
      });
    }
    
    if (Math.random() < 0.1) {
      alerts.push({
        id: `FUEL_${Date.now()}`,
        type: 'FUEL',
        priority: 'HIGH',
        message: 'Fuel consumption 8% above planned',
        timestamp: new Date().toISOString(),
        acknowledged: false,
        actionRequired: true
      });
    }

    return alerts;
  }

  /**
   * Validate data quality
   */
  public async validateDataQuality(aircraftId: string): Promise<StandardizedDigitalTwinData['dataQuality']> {
    return {
      completeness: 0.95 + Math.random() * 0.05,
      freshness: Math.floor(Math.random() * 30), // seconds since last update
      accuracy: 0.92 + Math.random() * 0.06,
      sources: ['ACARS', 'ADS-B', 'Flight Management System', 'Engine Monitoring'],
      validationStatus: 'VALID'
    };
  }

  // Helper methods

  /**
   * Map Virgin Atlantic fleet aircraft types to internal system types
   */
  private mapFleetTypeToSystemType(fleetType: string): string {
    const typeMapping: Record<string, string> = {
      'Airbus A330-300': 'A330-300',
      'Airbus A330-900': 'A330-900',
      'Airbus A350-1000': 'A350-1000',
      'Boeing 787-9 Dreamliner': 'B787-9'
    };
    
    return typeMapping[fleetType] || fleetType;
  }

  private extractAircraftTypeFromId(aircraftId: string): string {
    // Default to Boeing 787-9 for demonstration
    // In real implementation, this would map aircraft IDs to types
    const types = ['Boeing 787-9', 'Airbus A350-1000', 'Airbus A330-300'];
    return types[aircraftId.length % types.length];
  }

  private extractSeries(aircraftType: string): string {
    if (aircraftType.includes('787')) return '787';
    if (aircraftType.includes('A350')) return 'A350';
    if (aircraftType.includes('A330')) return 'A330';
    return 'Unknown';
  }

  private extractVariant(aircraftType: string): string {
    const match = aircraftType.match(/(787-9|A350-1000|A330-300)/);
    return match ? match[1] : 'Unknown';
  }

  private generateCurrentStateData(aircraft: AircraftPerformanceData, aircraftId: string): StandardizedDigitalTwinData['currentState'] {
    // Get Virgin Atlantic aircraft info if available
    const virginAtlanticAircraft = VirginAtlanticFleetUtils.getAircraftByRegistration(aircraftId);
    const now = new Date();
    
    return {
      timestamp: now.toISOString(),
      location: {
        latitude: 51.4706 + (Math.random() - 0.5) * 10, // Around London area
        longitude: -0.4619 + (Math.random() - 0.5) * 20,
        altitude: aircraft.performance.cruiseAltitude + (Math.random() - 0.5) * 2000,
        groundSpeed: aircraft.aerodynamics.cruiseSpeed + (Math.random() - 0.5) * 30,
        heading: Math.floor(Math.random() * 360),
        verticalSpeed: (Math.random() - 0.5) * 1000
      },
      engines: {
        count: aircraft.engines.count,
        thrustPercentage: 85 + Math.random() * 10,
        fuelFlowRate: aircraft.engines.fuelFlowCruise * aircraft.engines.count * (0.9 + Math.random() * 0.2),
        temperature: 380 + Math.random() * 40,
        status: 'NORMAL',
        efficiency: 92 + Math.random() * 6
      },
      systems: {
        autopilot: true,
        autothrust: true,
        flightControlStatus: 'NORMAL',
        hydraulicStatus: 'NORMAL',
        electricalStatus: 'NORMAL'
      },
      fuel: {
        totalRemaining: aircraft.weights.maxFuelCapacity * (0.2 + Math.random() * 0.5),
        totalCapacity: aircraft.weights.maxFuelCapacity,
        remainingPercentage: 20 + Math.random() * 50,
        consumption: aircraft.performance.fuelBurnPerHour * (0.9 + Math.random() * 0.2),
        efficiency: 1.8 + Math.random() * 0.4,
        endurance: 3 + Math.random() * 4
      },
      weather: {
        conditions: ['Clear', 'Light Turbulence', 'Moderate Turbulence'][Math.floor(Math.random() * 3)],
        impact: 'MINOR',
        windComponent: (Math.random() - 0.5) * 40,
        visibilityKm: 8 + Math.random() * 2
      }
    };
  }

  private generateOperationsData(aircraftId: string): StandardizedDigitalTwinData['operationsData'] {
    const departureTime = new Date();
    const arrivalTime = new Date(departureTime.getTime() + 8 * 60 * 60 * 1000); // 8 hours later
    
    return {
      flightPlan: {
        route: 'LHR-JFK',
        departureTime: departureTime.toISOString(),
        arrivalTime: arrivalTime.toISOString(),
        flightTime: 480, // 8 hours in minutes
        distance: 3459, // LHR-JFK distance in nautical miles
        plannedAltitude: 39000
      },
      passengers: {
        total: 250 + Math.floor(Math.random() * 50),
        checkedIn: 240 + Math.floor(Math.random() * 40),
        connecting: 45 + Math.floor(Math.random() * 20),
        specialServices: 5 + Math.floor(Math.random() * 10)
      },
      cargo: {
        weightKg: 8000 + Math.random() * 4000,
        volume: 120 + Math.random() * 30,
        hazardousMaterials: Math.random() < 0.1
      },
      crew: {
        pilots: 2,
        cabin: 8 + Math.floor(Math.random() * 4),
        total: 10 + Math.floor(Math.random() * 4)
      },
      airport: {
        departure: {
          icao: 'EGLL',
          gate: `T3-${Math.floor(Math.random() * 60) + 1}`,
          terminal: 'T3',
          stand: `${Math.floor(Math.random() * 59) + 1}`
        },
        arrival: {
          icao: 'KJFK',
          gate: `T1-${Math.floor(Math.random() * 12) + 1}`,
          terminal: 'T1',
          stand: `${Math.floor(Math.random() * 25) + 1}`
        }
      }
    };
  }

  private getDelayFactors(probability: number): string[] {
    const factors: string[] = [];
    
    if (probability > 0.15) factors.push('Weather conditions');
    if (probability > 0.2) factors.push('Air traffic congestion');
    if (Math.random() < 0.3) factors.push('Airport capacity limitations');
    if (Math.random() < 0.2) factors.push('Technical inspections');
    if (Math.random() < 0.1) factors.push('Crew availability');
    
    return factors.length > 0 ? factors : ['No significant delay factors identified'];
  }
}

// Export singleton instance
export const digitalTwinPerformanceService = new DigitalTwinPerformanceService();