export interface Boeing787Specifications {
  general: {
    model: string;
    manufacturer: string;
    firstFlight: string;
    certification: string;
    variants: string[];
  };
  dimensions: {
    length: number; // meters
    wingspan: number; // meters
    height: number; // meters
    cabinWidth: number; // meters
    cabinHeight: number; // meters
  };
  weights: {
    maxTakeoffWeight: number; // kg
    maxLandingWeight: number; // kg
    maxZeroFuelWeight: number; // kg
    operatingEmptyWeight: number; // kg
    maxPayload: number; // kg
  };
  performance: {
    maxCruiseSpeed: number; // Mach
    typicalCruiseSpeed: number; // Mach
    maxOperatingAltitude: number; // feet
    typicalCruiseAltitude: number; // feet
    range: number; // nautical miles
    takeoffDistance: number; // meters
    landingDistance: number; // meters
    climbRate: number; // feet per minute
  };
  fuel: {
    capacity: number; // liters
    consumptionCruise: number; // kg/hour
    consumptionTakeoff: number; // kg/hour
    consumptionLanding: number; // kg/hour
  };
  engines: {
    type: string;
    manufacturer: string;
    thrust: number; // lbf per engine
    count: number;
    bypassRatio: number;
    maxOperatingTemp: number; // Celsius
    normalOperatingTemp: number; // Celsius
  };
  systems: {
    autopilot: {
      manufacturer: string;
      capabilities: string[];
      autolandCapable: boolean;
    };
    avionics: {
      flightManagementSystem: string;
      primaryFlightDisplay: string;
      navigationDisplay: string;
      engineDisplay: string;
    };
    emergencySystems: {
      oxygenDuration: number; // minutes
      emergencyPowerDuration: number; // minutes
      evacuation: {
        maxTime: number; // seconds
        slideCount: number;
        exitCount: number;
      };
    };
  };
  operationalLimits: {
    maxPassengers: number;
    minRunwayLength: number; // meters
    maxCrosswind: number; // knots
    maxTailwind: number; // knots
    turbulenceLimit: string;
    icingConditions: boolean;
  };
  medicalCapabilities: {
    oxygenSupply: boolean;
    aed: boolean;
    medicalKit: boolean;
    stretcherCapability: boolean;
    doctorCallSystem: boolean;
  };
}

export const boeing787Specs: Boeing787Specifications = {
  general: {
    model: "Boeing 787-9 Dreamliner",
    manufacturer: "Boeing Commercial Airplanes",
    firstFlight: "September 17, 2013",
    certification: "FAA Type Certificate",
    variants: ["787-8", "787-9", "787-10"]
  },
  dimensions: {
    length: 62.8,
    wingspan: 60.1,
    height: 17.0,
    cabinWidth: 5.49,
    cabinHeight: 2.54
  },
  weights: {
    maxTakeoffWeight: 254011,
    maxLandingWeight: 192776,
    maxZeroFuelWeight: 181437,
    operatingEmptyWeight: 119950,
    maxPayload: 61487
  },
  performance: {
    maxCruiseSpeed: 0.90,
    typicalCruiseSpeed: 0.85,
    maxOperatingAltitude: 43000,
    typicalCruiseAltitude: 35000,
    range: 7635,
    takeoffDistance: 2800,
    landingDistance: 1600,
    climbRate: 3000
  },
  fuel: {
    capacity: 138700,
    consumptionCruise: 2500,
    consumptionTakeoff: 8000,
    consumptionLanding: 1800
  },
  engines: {
    type: "General Electric GEnx-1B",
    manufacturer: "General Electric",
    thrust: 64000,
    count: 2,
    bypassRatio: 9.3,
    maxOperatingTemp: 1000,
    normalOperatingTemp: 750
  },
  systems: {
    autopilot: {
      manufacturer: "Rockwell Collins",
      capabilities: [
        "Altitude Hold",
        "Heading Hold", 
        "Navigation Tracking",
        "Approach Control",
        "Autoland",
        "Autothrottle"
      ],
      autolandCapable: true
    },
    avionics: {
      flightManagementSystem: "Rockwell Collins FMS-4200",
      primaryFlightDisplay: "Rockwell Collins DU-875",
      navigationDisplay: "Rockwell Collins DU-875",
      engineDisplay: "Rockwell Collins DU-875"
    },
    emergencySystems: {
      oxygenDuration: 22,
      emergencyPowerDuration: 30,
      evacuation: {
        maxTime: 90,
        slideCount: 8,
        exitCount: 8
      }
    }
  },
  operationalLimits: {
    maxPassengers: 296,
    minRunwayLength: 2800,
    maxCrosswind: 38,
    maxTailwind: 15,
    turbulenceLimit: "Severe",
    icingConditions: true
  },
  medicalCapabilities: {
    oxygenSupply: true,
    aed: true,
    medicalKit: true,
    stretcherCapability: true,
    doctorCallSystem: true
  }
};

// Flight envelope calculations
export class FlightEnvelope {
  static getVSpeeds(weight: number): { v1: number; vr: number; v2: number; vref: number } {
    // V-speeds calculation based on aircraft weight
    const weightRatio = weight / boeing787Specs.weights.maxTakeoffWeight;
    
    return {
      v1: Math.round(140 + (weightRatio * 20)), // Decision speed
      vr: Math.round(150 + (weightRatio * 25)), // Rotation speed
      v2: Math.round(160 + (weightRatio * 30)), // Takeoff safety speed
      vref: Math.round(130 + (weightRatio * 15))  // Reference landing speed
    };
  }

  static getPerformanceLimits(altitude: number, temperature: number): {
    maxThrust: number;
    maxSpeed: number;
    serviceceiling: number;
  } {
    const altitudeFactor = 1 - (altitude / 50000);
    const temperatureFactor = 1 - ((temperature - 15) / 100);
    
    return {
      maxThrust: boeing787Specs.engines.thrust * altitudeFactor * temperatureFactor,
      maxSpeed: 0.90 * altitudeFactor, // Mach limit
      serviceceiling: boeing787Specs.performance.maxOperatingAltitude
    };
  }

  static calculateFuelConsumption(
    altitude: number, 
    speed: number, 
    weight: number, 
    flightPhase: 'takeoff' | 'climb' | 'cruise' | 'descent' | 'landing'
  ): number {
    let baseConsumption: number;
    
    switch (flightPhase) {
      case 'takeoff':
        baseConsumption = boeing787Specs.fuel.consumptionTakeoff;
        break;
      case 'landing':
        baseConsumption = boeing787Specs.fuel.consumptionLanding;
        break;
      default:
        baseConsumption = boeing787Specs.fuel.consumptionCruise;
    }
    
    // Adjust for altitude and weight
    const altitudeFactor = 1 - (altitude / 100000); // Higher altitude = less consumption
    const weightFactor = weight / boeing787Specs.weights.maxTakeoffWeight;
    const speedFactor = speed / boeing787Specs.performance.typicalCruiseSpeed;
    
    return baseConsumption * altitudeFactor * weightFactor * speedFactor;
  }

  static getGlidePerformance(altitude: number, weight: number): {
    glideRatio: number;
    glideDistance: number;
    glideSpeed: number;
  } {
    const weightFactor = weight / boeing787Specs.weights.maxLandingWeight;
    const glideRatio = 17 / weightFactor; // Boeing 787 typical glide ratio
    
    return {
      glideRatio,
      glideDistance: (altitude / 6076) * glideRatio, // nautical miles
      glideSpeed: 250 + (weightFactor * 20) // knots
    };
  }

  static getDiversionCapabilities(currentWeight: number, currentFuel: number): {
    maxDiversionDistance: number;
    fuelReserveRequired: number;
    alternateAirportFuel: number;
  } {
    const fuelConsumptionRate = this.calculateFuelConsumption(35000, 0.85, currentWeight, 'cruise');
    const reserveFuel = boeing787Specs.fuel.capacity * 0.05; // 5% reserve
    const alternateFuel = fuelConsumptionRate * 1.5; // 1.5 hours for alternate
    
    const availableFuel = currentFuel - reserveFuel - alternateFuel;
    const maxFlightTime = availableFuel / fuelConsumptionRate;
    const maxDistance = maxFlightTime * (boeing787Specs.performance.typicalCruiseSpeed * 661.47); // Convert to nautical miles
    
    return {
      maxDiversionDistance: maxDistance,
      fuelReserveRequired: reserveFuel,
      alternateAirportFuel: alternateFuel
    };
  }
}

// Emergency procedure specifications
export const emergencyProcedures = {
  medicalDiversion: {
    timeToDescend: 8, // minutes to emergency descent
    descentRate: 6000, // feet per minute
    diversionSpeed: 0.78, // Mach
    fuelDumpCapable: false,
    maxDiversionRange: 2000 // nautical miles
  },
  engineFailure: {
    singleEngineServiceCeiling: 25000, // feet
    singleEngineDriftDown: 1500, // feet per minute
    singleEngineRange: 3000, // nautical miles
    minimumControlSpeed: 120 // knots
  },
  pressurization: {
    emergencyDescentRate: 8000, // feet per minute
    emergencyDescentSpeed: 350, // knots
    oxygenDeploymentAltitude: 14000, // feet
    safeCabinAltitude: 10000 // feet
  },
  evacuation: {
    maxEvacuationTime: 90, // seconds
    slideDeploymentTime: 6, // seconds
    emergencyLighting: 10, // minutes
    batteryPower: 30 // minutes
  }
};

