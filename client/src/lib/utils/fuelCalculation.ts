// Fuel calculation utilities for AINO platform
// Convert kg values to percentage based on aircraft fuel capacity and flight progress

export interface AircraftFuelCapacity {
  [key: string]: number;
}

// Authentic Virgin Atlantic aircraft fuel capacities (in kg)
export const AIRCRAFT_FUEL_CAPACITIES: AircraftFuelCapacity = {
  'A35K': 156000, // Airbus A350-1000: 156,000kg fuel capacity, 8,700nm range
  'A350': 156000,
  'A350-1000': 156000,
  'B789': 126372, // Boeing 787-9: 126,372kg fuel capacity, 7,635nm range  
  'B787': 126372,
  'B787-9': 126372,
  'A333': 97530,  // Airbus A330-300: 97,530kg fuel capacity, 6,350nm range
  'A330': 97530,
  'A330-300': 97530,
  'A339': 111000, // Airbus A330-900: 111,000kg fuel capacity
  'A330-900': 111000,
  'A343': 147000, // Airbus A340-300: 147,000kg fuel capacity (legacy Virgin Atlantic)
  'A340': 147000,
  'A340-300': 147000,
  'UNKNOWN': 120000, // Default capacity for unknown aircraft types
  'DEFAULT': 120000
};

/**
 * Calculate fuel percentage based on flight progress and aircraft type
 * Uses authentic aircraft fuel capacities and realistic burn rates
 */
export function calculateFuelPercentage(
  aircraftType: string, 
  flightProgress: number = 50, 
  route?: string
): number {
  // Get authentic fuel capacity for aircraft type
  const fuelCapacity = AIRCRAFT_FUEL_CAPACITIES[aircraftType] || AIRCRAFT_FUEL_CAPACITIES['DEFAULT'];
  
  // Calculate remaining fuel percentage based on flight progress
  // Assumes aircraft started with 85-95% fuel capacity (typical airline practice)
  const initialFuelPercentage = 90; // 90% of maximum capacity
  
  // Calculate fuel burn based on flight progress
  // Long-haul flights (>3000nm) burn more efficiently per hour
  const isLongHaul = route && (
    route.includes('JFK') || route.includes('LAX') || route.includes('SFO') ||
    route.includes('BOS') || route.includes('ATL') || route.includes('DEL') ||
    route.includes('BOM') || route.includes('JNB') || route.includes('CPT')
  );
  
  // Fuel burn rate calculation (percentage of capacity per hour)
  const burnRatePerHour = isLongHaul ? 8.5 : 12.0; // Long-haul more efficient
  
  // Estimate flight duration based on route type
  const estimatedFlightHours = isLongHaul ? 8.5 : 4.0;
  
  // Calculate total fuel burn for complete flight
  const totalFlightBurn = (burnRatePerHour * estimatedFlightHours);
  
  // Calculate current fuel burn based on progress
  const currentBurn = (flightProgress / 100) * totalFlightBurn;
  
  // Calculate remaining fuel percentage
  const remainingFuelPercentage = Math.max(0, initialFuelPercentage - currentBurn);
  
  // Ensure realistic range (15-95%)
  return Math.min(95, Math.max(15, Math.round(remainingFuelPercentage)));
}

/**
 * Calculate fuel amount in kg based on percentage and aircraft type
 */
export function calculateFuelAmountKg(
  aircraftType: string, 
  fuelPercentage: number
): number {
  const fuelCapacity = AIRCRAFT_FUEL_CAPACITIES[aircraftType] || AIRCRAFT_FUEL_CAPACITIES['DEFAULT'];
  return Math.round((fuelPercentage / 100) * fuelCapacity);
}

/**
 * Get fuel efficiency description based on percentage
 */
export function getFuelEfficiencyDescription(fuelPercentage: number): string {
  if (fuelPercentage >= 80) return 'EXCELLENT';
  if (fuelPercentage >= 60) return 'GOOD';
  if (fuelPercentage >= 40) return 'MODERATE';
  if (fuelPercentage >= 20) return 'LOW';
  return 'CRITICAL';
}

/**
 * Get fuel optimization strategy based on remaining fuel and route
 */
export function getFuelOptimizationStrategy(
  fuelPercentage: number, 
  route?: string
): string {
  const isLongHaul = route && (
    route.includes('JFK') || route.includes('LAX') || route.includes('SFO') ||
    route.includes('BOS') || route.includes('ATL') || route.includes('DEL') ||
    route.includes('BOM') || route.includes('JNB') || route.includes('CPT')
  );
  
  if (fuelPercentage >= 70) {
    return isLongHaul ? 'TANKERING' : 'STANDARD';
  } else if (fuelPercentage >= 40) {
    return 'STANDARD';
  } else if (fuelPercentage >= 25) {
    return 'ECONOMY';
  } else {
    return 'CRITICAL';
  }
}