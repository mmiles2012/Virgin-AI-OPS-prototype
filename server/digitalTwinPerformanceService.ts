/**
 * Digital Twin Performance Service for AINO Aviation Intelligence Platform
 * Provides enhanced flight calculations using aircraft-specific performance data
 */

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

export class DigitalTwinPerformanceService {
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
}

// Export singleton instance
export const digitalTwinPerformanceService = new DigitalTwinPerformanceService();