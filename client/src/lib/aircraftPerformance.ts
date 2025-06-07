// Boeing 787 Emergency Performance Calculator
// Based on actual aircraft specifications and operational data

export interface AircraftSpecs {
  maxFuel: number; // kg
  normalCruiseBurn: number; // kg/hr
  normalCruiseSpeed: number; // knots
  normalCruiseAltitude: number; // ft
  maxRange: number; // nautical miles
  serviceCeiling: number; // ft
}

export interface FlightPerformanceData {
  altitude: number;
  speed: number;
  fuelRemaining: number;
  fuelBurnRate: number;
  range: number;
  timeRemaining: number;
  emergencyStatus: string;
  altitudeChangeFuel?: number;
}

export interface EmergencyScenario {
  name: string;
  fuelBurnMultiplier: number;
  speedReduction: number;
  altitudeRestriction: number | null;
  description: string;
  operationalImpact: string[];
  diversionRequired: boolean;
  timeToStabilize: number; // minutes
}

// Boeing 787-9 baseline specifications
export const BOEING_787_SPECS: AircraftSpecs = {
  maxFuel: 126206, // kg
  normalCruiseBurn: 2800, // kg/hr
  normalCruiseSpeed: 480, // knots
  normalCruiseAltitude: 41000, // ft
  maxRange: 7635, // nautical miles
  serviceCeiling: 43000 // ft
};

export const EMERGENCY_SCENARIOS: Record<string, EmergencyScenario> = {
  normal: {
    name: 'Normal Operations',
    fuelBurnMultiplier: 1.0,
    speedReduction: 0,
    altitudeRestriction: null,
    description: 'Normal cruise flight operations',
    operationalImpact: ['No operational restrictions'],
    diversionRequired: false,
    timeToStabilize: 0
  },
  engineFailure: {
    name: 'Single Engine Failure',
    fuelBurnMultiplier: 1.35,
    speedReduction: 40,
    altitudeRestriction: 25000,
    description: 'One engine inoperative - increased drag and fuel burn',
    operationalImpact: [
      'Immediate altitude restriction to 25,000ft',
      'Reduced cruise speed by 40 knots',
      '35% increase in fuel consumption',
      'Consider immediate diversion to nearest suitable airport'
    ],
    diversionRequired: true,
    timeToStabilize: 15
  },
  hydraulicFault: {
    name: 'Major Hydraulic Fault',
    fuelBurnMultiplier: 1.15,
    speedReduction: 20,
    altitudeRestriction: null,
    description: 'Backup flight controls - increased fuel consumption',
    operationalImpact: [
      'Backup flight control systems engaged',
      'Slightly reduced maneuverability',
      '15% increase in fuel consumption',
      'Continue to destination with monitoring'
    ],
    diversionRequired: false,
    timeToStabilize: 10
  },
  electricalFault: {
    name: 'Major Electrical Fault',
    fuelBurnMultiplier: 1.25,
    speedReduction: 30,
    altitudeRestriction: 35000,
    description: 'Emergency electrical configuration - limited systems',
    operationalImpact: [
      'Emergency electrical configuration active',
      'Limited system functionality',
      'Altitude restriction to 35,000ft',
      'Consider precautionary landing'
    ],
    diversionRequired: true,
    timeToStabilize: 20
  },
  depressurization: {
    name: 'Cabin Depressurization',
    fuelBurnMultiplier: 1.45,
    speedReduction: 60,
    altitudeRestriction: 10000,
    description: 'Emergency descent to 10,000ft - high fuel burn',
    operationalImpact: [
      'Immediate emergency descent to 10,000ft',
      'Oxygen masks deployed',
      '45% increase in fuel consumption at low altitude',
      'Immediate diversion required'
    ],
    diversionRequired: true,
    timeToStabilize: 5
  },
  medicalEmergency: {
    name: 'Medical Emergency',
    fuelBurnMultiplier: 1.05,
    speedReduction: 0,
    altitudeRestriction: null,
    description: 'Passenger medical emergency requiring immediate landing',
    operationalImpact: [
      'Maintain current flight level if possible',
      'Increase speed for time-critical diversion',
      'Coordinate with medical advisory services',
      'Priority handling for emergency landing'
    ],
    diversionRequired: true,
    timeToStabilize: 0
  }
};

export class AircraftPerformanceCalculator {
  private specs: AircraftSpecs;

  constructor(specs: AircraftSpecs = BOEING_787_SPECS) {
    this.specs = specs;
  }

  calculateEmergencyImpact(
    currentData: Partial<FlightPerformanceData>,
    scenarioType: string
  ): FlightPerformanceData {
    const scenario = EMERGENCY_SCENARIOS[scenarioType] || EMERGENCY_SCENARIOS.normal;
    
    const currentAltitude = currentData.altitude || this.specs.normalCruiseAltitude;
    const currentFuel = currentData.fuelRemaining || (this.specs.maxFuel * 0.6); // Assume 60% fuel remaining
    
    let newAltitude = currentAltitude;
    let newSpeed = this.specs.normalCruiseSpeed - scenario.speedReduction;
    let newFuelBurnRate = this.specs.normalCruiseBurn * scenario.fuelBurnMultiplier;
    
    // Apply altitude restrictions
    if (scenario.altitudeRestriction && currentAltitude > scenario.altitudeRestriction) {
      newAltitude = scenario.altitudeRestriction;
    }
    
    // Calculate additional fuel burn for altitude changes
    let altitudeChangeFuel = 0;
    if (newAltitude < currentAltitude) {
      // Emergency descent fuel penalty
      const descentDistance = (currentAltitude - newAltitude) / 1000;
      altitudeChangeFuel = descentDistance * 150; // kg per 1000ft descent penalty
    }
    
    // Calculate new range based on fuel burn
    const effectiveFuel = Math.max(0, currentFuel - altitudeChangeFuel);
    const newTimeRemaining = Math.max(0, effectiveFuel / newFuelBurnRate);
    const newRange = (newSpeed * newTimeRemaining) / 1.15078; // Convert to nautical miles
    
    return {
      altitude: newAltitude,
      speed: newSpeed,
      fuelBurnRate: newFuelBurnRate,
      fuelRemaining: effectiveFuel,
      timeRemaining: newTimeRemaining,
      range: Math.round(newRange),
      emergencyStatus: scenario.name,
      altitudeChangeFuel
    };
  }

  calculateDiversionFuelRequirement(
    currentPosition: { lat: number; lon: number },
    diversionAirport: { lat: number; lon: number },
    currentAltitude: number,
    scenarioType: string = 'normal'
  ): {
    distance: number;
    fuelRequired: number;
    flightTime: number;
    feasible: boolean;
  } {
    // Calculate great circle distance
    const distance = this.calculateDistance(
      currentPosition.lat, currentPosition.lon,
      diversionAirport.lat, diversionAirport.lon
    );

    const scenario = EMERGENCY_SCENARIOS[scenarioType];
    const cruiseSpeed = this.specs.normalCruiseSpeed - scenario.speedReduction;
    const fuelBurnRate = this.specs.normalCruiseBurn * scenario.fuelBurnMultiplier;
    
    // Flight time in hours
    const flightTime = distance / cruiseSpeed;
    
    // Base fuel requirement
    let fuelRequired = fuelBurnRate * flightTime;
    
    // Add descent fuel if altitude restriction applies
    if (scenario.altitudeRestriction && currentAltitude > scenario.altitudeRestriction) {
      const descentFuel = ((currentAltitude - scenario.altitudeRestriction) / 1000) * 150;
      fuelRequired += descentFuel;
    }
    
    // Add reserve fuel (minimum 30 minutes)
    fuelRequired += (fuelBurnRate * 0.5);
    
    return {
      distance,
      fuelRequired: Math.round(fuelRequired),
      flightTime,
      feasible: fuelRequired < (this.specs.maxFuel * 0.8) // Must be within 80% of max fuel capacity
    };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  getScenarioImpactSummary(scenarioType: string): {
    scenario: EmergencyScenario;
    rangeReduction: number;
    fuelIncreasePercent: number;
    operationalRecommendations: string[];
  } {
    const scenario = EMERGENCY_SCENARIOS[scenarioType];
    const normalRange = this.specs.maxRange;
    
    // Calculate approximate range reduction
    const effectiveSpeed = this.specs.normalCruiseSpeed - scenario.speedReduction;
    const effectiveBurnRate = this.specs.normalCruiseBurn * scenario.fuelBurnMultiplier;
    const newRange = (effectiveSpeed * (this.specs.maxFuel / effectiveBurnRate)) / 1.15078;
    const rangeReduction = normalRange - newRange;
    
    const fuelIncreasePercent = (scenario.fuelBurnMultiplier - 1) * 100;
    
    const operationalRecommendations = [
      ...scenario.operationalImpact,
      scenario.diversionRequired ? 'Immediate diversion recommended' : 'Continue monitoring',
      `Fuel consumption increased by ${fuelIncreasePercent.toFixed(1)}%`,
      `Range reduced by approximately ${Math.round(rangeReduction)} nautical miles`
    ];

    return {
      scenario,
      rangeReduction: Math.round(rangeReduction),
      fuelIncreasePercent,
      operationalRecommendations
    };
  }
}

export const performanceCalculator = new AircraftPerformanceCalculator();