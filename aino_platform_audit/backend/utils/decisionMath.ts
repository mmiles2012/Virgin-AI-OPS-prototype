/**
 * Decision Mathematics Utilities for AINO Aviation Intelligence Platform
 * Core mathematical functions for decision scoring and constraint evaluation
 */

export interface DecisionFactors {
  safetyScore: number;
  costImpact: number;
  timeImpact: number;
  feasibility: number;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
}

export interface DecisionWeights {
  safety: number;
  cost: number;
  time: number;
  feasibility: number;
}

export interface ConstraintEvaluation {
  fuelConstraints: {
    satisfied: boolean;
    remainingMargin: number;
    criticalLevel: boolean;
  };
  weatherConstraints: {
    satisfied: boolean;
    visibility: number;
    windLimits: boolean;
  };
  operationalConstraints: {
    satisfied: boolean;
    airportCapacity: number;
    groundServices: boolean;
  };
  timeConstraints: {
    satisfied: boolean;
    urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
  };
}

/**
 * Core decision scoring function using weighted multi-criteria analysis
 * Compatible with existing decision engine patterns
 */
export function scoreDecision(
  factors: DecisionFactors,
  weights: DecisionWeights
): number {
  // Normalize safety score (0-100)
  const normalizedSafety = Math.min(100, Math.max(0, factors.safetyScore));
  
  // Cost scoring (inverse - lower cost = higher score)
  const normalizedCost = Math.max(0, 100 - Math.min(100, factors.costImpact / 1000));
  
  // Time scoring (inverse - less time = higher score) 
  const normalizedTime = Math.max(0, 100 - Math.min(100, factors.timeImpact / 10));
  
  // Feasibility is already 0-100
  const normalizedFeasibility = Math.min(100, Math.max(0, factors.feasibility));
  
  // Calculate weighted score using the exact pattern from decision engine
  const score = (normalizedSafety * weights.safety) + 
                (normalizedCost * weights.cost) + 
                (normalizedTime * weights.time) + 
                (normalizedFeasibility * weights.feasibility);
  
  // Apply risk penalty if specified
  const riskPenalty = factors.riskLevel ? getRiskPenalty(factors.riskLevel) : 0;
  const adjustedScore = score * (1 - riskPenalty);
  
  return Math.round(adjustedScore * 100) / 100;
}

/**
 * Evaluate operational constraints for aviation decisions
 */
export function evaluateConstraints(
  flightState: any,
  scenario: any,
  targetAirport?: any
): ConstraintEvaluation {
  return {
    fuelConstraints: evaluateFuelConstraints(flightState, targetAirport),
    weatherConstraints: evaluateWeatherConstraints(flightState, targetAirport),
    operationalConstraints: evaluateOperationalConstraints(targetAirport, scenario),
    timeConstraints: evaluateTimeConstraints(flightState, scenario)
  };
}

/**
 * Fuel constraint evaluation with aviation safety margins
 */
function evaluateFuelConstraints(flightState: any, targetAirport?: any) {
  const currentFuel = flightState.fuelRemaining || 0;
  const fuelBurnRate = 3000; // kg/hour average for twin-engine aircraft
  
  let requiredFuel = 10000; // minimum landing reserves
  
  if (targetAirport && flightState.position) {
    const distance = calculateDistance(
      flightState.position.lat,
      flightState.position.lon,
      targetAirport.lat,
      targetAirport.lon
    );
    
    const flightTime = distance / (flightState.airspeed || 450);
    requiredFuel = (flightTime * fuelBurnRate) + 15000; // flight + reserves
  }
  
  const remainingMargin = currentFuel - requiredFuel;
  const criticalLevel = currentFuel < 30000;
  
  return {
    satisfied: remainingMargin > 0,
    remainingMargin,
    criticalLevel
  };
}

/**
 * Weather constraints for aviation operations
 */
function evaluateWeatherConstraints(flightState: any, targetAirport?: any) {
  // Simplified weather evaluation - would use real METAR data in production
  const visibility = 8000 + Math.random() * 2000; // meters
  const windSpeed = Math.random() * 25; // knots
  
  const visibilityOK = visibility >= 1600; // CAT I minimums
  const windOK = windSpeed <= 35; // aircraft limits
  
  return {
    satisfied: visibilityOK && windOK,
    visibility,
    windLimits: windOK
  };
}

/**
 * Operational constraints assessment
 */
function evaluateOperationalConstraints(targetAirport?: any, scenario?: any) {
  if (!targetAirport) {
    return {
      satisfied: true,
      airportCapacity: 100,
      groundServices: true
    };
  }
  
  const capacity = targetAirport.capacity || 50;
  const groundServices = targetAirport.groundServices !== false;
  
  return {
    satisfied: capacity > 20 && groundServices,
    airportCapacity: capacity,
    groundServices
  };
}

/**
 * Time constraints based on scenario urgency
 */
function evaluateTimeConstraints(flightState: any, scenario: any) {
  let urgencyLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
  
  if (scenario?.severity === 'high' || scenario?.type === 'medical') {
    urgencyLevel = 'critical';
  } else if (flightState.emergency?.declared) {
    urgencyLevel = 'high';
  }
  
  return {
    satisfied: true, // simplified for now
    urgencyLevel
  };
}

/**
 * Calculate great circle distance for aviation
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Risk level penalty factors
 */
function getRiskPenalty(riskLevel: string): number {
  switch (riskLevel) {
    case 'low': return 0;
    case 'medium': return 0.05;
    case 'high': return 0.15;
    case 'critical': return 0.25;
    default: return 0;
  }
}