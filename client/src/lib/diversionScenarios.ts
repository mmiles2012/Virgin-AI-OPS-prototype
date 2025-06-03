import { airports } from './airportData';

export interface DiversionOutcome {
  airportCode: string;
  airportName: string;
  distance: number;
  flightTime: number;
  fuelRequired: number;
  fuelRemaining: number;
  medicalFacilities: 'excellent' | 'good' | 'basic' | 'limited';
  weatherConditions: 'good' | 'marginal' | 'poor';
  runwayLength: number;
  approachDifficulty: 'easy' | 'moderate' | 'difficult';
  costs: {
    fuel: number;
    delay: number;
    passenger: number;
    crew: number;
    total: number;
  };
  consequences: {
    medicalOutcome: 'critical' | 'stable' | 'good' | 'excellent';
    passengerImpact: string;
    crewWorkload: 'low' | 'moderate' | 'high' | 'extreme';
    airlineReputation: 'positive' | 'neutral' | 'negative';
    regulatoryIssues: string[];
  };
  timeline: {
    decisionTime: number; // minutes from now
    approachTime: number; // minutes to approach
    landingTime: number; // minutes to landing
    medicalResponse: number; // minutes to medical team
  };
  riskFactors: string[];
  advantages: string[];
  realWorldExample?: string;
}

export interface ScenarioContext {
  currentPosition: { lat: number; lon: number; altitude: number };
  emergencyType: 'cardiac' | 'stroke' | 'trauma' | 'breathing' | 'allergic';
  patientCondition: 'critical' | 'serious' | 'stable';
  timeToDestination: number; // minutes to original destination
  fuelRemaining: number; // kg
  weather: {
    visibility: number; // miles
    windSpeed: number; // knots
    turbulence: 'none' | 'light' | 'moderate' | 'severe';
  };
  crewExperience: 'junior' | 'experienced' | 'senior';
}

export function generateDiversionScenarios(context: ScenarioContext): DiversionOutcome[] {
  const nearbyAirports = findNearbyAirports(context.currentPosition, 500); // 500nm radius
  
  return nearbyAirports.map(airport => {
    const distance = calculateDistance(
      context.currentPosition.lat, 
      context.currentPosition.lon,
      airport.lat, 
      airport.lon
    );
    
    const flightTime = calculateFlightTime(distance, context.currentPosition.altitude);
    const fuelRequired = calculateFuelRequired(distance, flightTime);
    const fuelRemaining = context.fuelRemaining - fuelRequired;
    
    return {
      airportCode: airport.iata,
      airportName: airport.name,
      distance,
      flightTime,
      fuelRequired,
      fuelRemaining,
      medicalFacilities: assessMedicalFacilities(airport),
      weatherConditions: assessWeatherConditions(airport, context.weather),
      runwayLength: 8000, // Default runway length for Boeing 787 operations
      approachDifficulty: assessApproachDifficulty(airport, context.weather),
      costs: calculateDiversionCosts(distance, flightTime, context.emergencyType),
      consequences: assessConsequences(airport, context, distance, flightTime),
      timeline: calculateTimeline(flightTime, airport, context.emergencyType),
      riskFactors: identifyRiskFactors(airport, context, distance, fuelRemaining),
      advantages: identifyAdvantages(airport, context, distance),
      realWorldExample: getRealWorldExample(airport.iata, context.emergencyType)
    };
  }).sort((a, b) => {
    // Sort by overall suitability score
    const scoreA = calculateSuitabilityScore(a, context);
    const scoreB = calculateSuitabilityScore(b, context);
    return scoreB - scoreA;
  });
}

function findNearbyAirports(position: { lat: number; lon: number }, maxDistance: number) {
  return airports.filter(airport => {
    const distance = calculateDistance(position.lat, position.lon, airport.lat, airport.lon);
    return distance <= maxDistance;
  }).slice(0, 8); // Limit to 8 closest airports
}

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

function calculateFlightTime(distance: number, currentAltitude: number): number {
  // Account for descent time and approach
  const cruiseSpeed = 450; // knots
  const descentTime = currentAltitude / 2000; // 2000 fpm descent rate
  const approachTime = 15; // minutes for approach and landing
  
  return (distance / cruiseSpeed * 60) + descentTime + approachTime;
}

function calculateFuelRequired(distance: number, flightTime: number): number {
  // Boeing 787 fuel consumption: approximately 5.77 kg per nautical mile
  const baseFuelRate = 5.77;
  const holdingFuel = 2000; // kg for holding and approach
  const emergencyReserve = 1500; // kg emergency reserve
  
  return (distance * baseFuelRate) + holdingFuel + emergencyReserve;
}

function assessMedicalFacilities(airport: any): 'excellent' | 'good' | 'basic' | 'limited' {
  // Based on airport size and location
  if (airport.type === 'large_airport') {
    return Math.random() > 0.3 ? 'excellent' : 'good';
  } else if (airport.type === 'medium_airport') {
    return Math.random() > 0.5 ? 'good' : 'basic';
  } else {
    return Math.random() > 0.7 ? 'basic' : 'limited';
  }
}

function assessWeatherConditions(airport: any, weather: any): 'good' | 'marginal' | 'poor' {
  if (weather.visibility > 5 && weather.windSpeed < 20) return 'good';
  if (weather.visibility > 2 && weather.windSpeed < 35) return 'marginal';
  return 'poor';
}

function assessApproachDifficulty(airport: any, weather: any): 'easy' | 'moderate' | 'difficult' {
  let difficulty = 0;
  
  if (weather.windSpeed > 25) difficulty += 1;
  if (weather.turbulence === 'moderate' || weather.turbulence === 'severe') difficulty += 1;
  if (weather.visibility < 3) difficulty += 1;
  if (airport.elevation && airport.elevation > 3000) difficulty += 1;
  
  if (difficulty === 0) return 'easy';
  if (difficulty <= 2) return 'moderate';
  return 'difficult';
}

function calculateDiversionCosts(distance: number, flightTime: number, emergencyType: string): any {
  const fuelCost = distance * 5.77 * 0.8; // $0.80 per kg fuel
  const delayCost = flightTime * 150; // $150 per minute delay
  const passengerCost = 250 * 15000; // 250 passengers x $60 average compensation
  const crewCost = flightTime * 200; // crew overtime costs
  
  // Emergency type affects costs
  const emergencyMultiplier = emergencyType === 'cardiac' ? 1.5 : 1.2;
  
  return {
    fuel: Math.round(fuelCost),
    delay: Math.round(delayCost * emergencyMultiplier),
    passenger: Math.round(passengerCost),
    crew: Math.round(crewCost),
    total: Math.round((fuelCost + delayCost + passengerCost + crewCost) * emergencyMultiplier)
  };
}

function assessConsequences(airport: any, context: ScenarioContext, distance: number, flightTime: number): any {
  const medicalOutcome = assessMedicalOutcome(airport, context, flightTime);
  const passengerImpact = assessPassengerImpact(distance, flightTime, context);
  const crewWorkload = assessCrewWorkload(distance, context, airport);
  const airlineReputation = assessReputationImpact(medicalOutcome, flightTime);
  const regulatoryIssues = assessRegulatoryIssues(context, airport);
  
  return {
    medicalOutcome,
    passengerImpact,
    crewWorkload,
    airlineReputation,
    regulatoryIssues
  };
}

function assessMedicalOutcome(airport: any, context: ScenarioContext, flightTime: number): 'critical' | 'stable' | 'good' | 'excellent' {
  let score = 0;
  
  // Time criticality
  if (flightTime < 30 && context.patientCondition === 'critical') score += 2;
  else if (flightTime < 60) score += 1;
  
  // Medical facilities
  const facilities = assessMedicalFacilities(airport);
  if (facilities === 'excellent') score += 3;
  else if (facilities === 'good') score += 2;
  else if (facilities === 'basic') score += 1;
  
  // Emergency type considerations
  if (context.emergencyType === 'cardiac' && facilities === 'excellent') score += 1;
  if (context.emergencyType === 'stroke' && flightTime < 45) score += 1;
  
  if (score >= 5) return 'excellent';
  if (score >= 3) return 'good';
  if (score >= 1) return 'stable';
  return 'critical';
}

function assessPassengerImpact(distance: number, flightTime: number, context: ScenarioContext): string {
  if (distance < 100) return "Minimal disruption - short diversion with quick resolution";
  if (distance < 300) return "Moderate delay - passengers will need rebooking assistance";
  if (flightTime > 120) return "Significant disruption - overnight accommodation may be required";
  return "Major impact - extensive passenger care and compensation needed";
}

function assessCrewWorkload(distance: number, context: ScenarioContext, airport: any): 'low' | 'moderate' | 'high' | 'extreme' {
  let workload = 0;
  
  if (distance > 200) workload += 1;
  if (context.weather.turbulence === 'moderate' || context.weather.turbulence === 'severe') workload += 1;
  if (context.crewExperience === 'junior') workload += 1;
  if (assessApproachDifficulty(airport, context.weather) === 'difficult') workload += 2;
  if (context.patientCondition === 'critical') workload += 1;
  
  if (workload >= 4) return 'extreme';
  if (workload >= 3) return 'high';
  if (workload >= 1) return 'moderate';
  return 'low';
}

function assessReputationImpact(medicalOutcome: string, flightTime: number): 'positive' | 'neutral' | 'negative' {
  if (medicalOutcome === 'excellent' || medicalOutcome === 'good') return 'positive';
  if (flightTime > 180 && medicalOutcome === 'critical') return 'negative';
  return 'neutral';
}

function assessRegulatoryIssues(context: ScenarioContext, airport: any): string[] {
  const issues: string[] = [];
  
  if (context.fuelRemaining < 5000) {
    issues.push("Low fuel state - requires priority handling");
  }
  
  if (context.patientCondition === 'critical') {
    issues.push("Medical emergency declaration - coordination with medical services required");
  }
  
  if (airport.country !== 'US') {
    issues.push("International diversion - customs and immigration considerations");
  }
  
  return issues;
}

function calculateTimeline(flightTime: number, airport: any, emergencyType: string): any {
  const decisionTime = emergencyType === 'cardiac' ? 5 : 10; // minutes to make decision
  const approachTime = flightTime - 15; // time to start approach
  const landingTime = flightTime;
  const medicalResponse = landingTime + (airport.type === 'large_airport' ? 3 : 8); // medical team response
  
  return {
    decisionTime,
    approachTime,
    landingTime,
    medicalResponse
  };
}

function identifyRiskFactors(airport: any, context: ScenarioContext, distance: number, fuelRemaining: number): string[] {
  const risks: string[] = [];
  
  if (fuelRemaining < 3000) risks.push("Tight fuel margins");
  if (context.weather.visibility < 2) risks.push("Low visibility conditions");
  if (context.weather.windSpeed > 30) risks.push("Strong crosswinds");
  if (distance > 400) risks.push("Long diversion distance");
  if (airport.elevation && airport.elevation > 4000) risks.push("High altitude airport");
  if (context.crewExperience === 'junior') risks.push("Junior crew workload");
  
  return risks;
}

function identifyAdvantages(airport: any, context: ScenarioContext, distance: number): string[] {
  const advantages: string[] = [];
  
  if (distance < 150) advantages.push("Close proximity");
  if (airport.type === 'large_airport') advantages.push("Major airport with full facilities");
  if (assessMedicalFacilities(airport) === 'excellent') advantages.push("Excellent medical facilities");
  if (context.weather.visibility > 5) advantages.push("Good weather conditions");
  if (airport.runways && airport.runways[0]?.length > 10000) advantages.push("Long runway available");
  
  return advantages;
}

function getRealWorldExample(airportCode: string, emergencyType: string): string | undefined {
  const examples: Record<string, Record<string, string>> = {
    'LAX': {
      'cardiac': 'Similar to 2019 United flight diversion where passenger cardiac event led to successful emergency landing with medical team standing by',
      'stroke': 'Comparable to 2020 Delta medical emergency where quick LAX diversion enabled critical stroke treatment within golden hour'
    },
    'DEN': {
      'cardiac': 'Similar to 2021 Southwest medical diversion where high-altitude approach required careful crew coordination for cardiac patient',
      'breathing': 'Like 2020 American Airlines oxygen emergency where Denver\'s medical facilities provided immediate respiratory support'
    },
    'ORD': {
      'trauma': 'Comparable to 2018 medical emergency where Chicago\'s trauma centers were crucial for passenger injury treatment',
      'cardiac': 'Similar to multiple United diversions where ORD\'s proximity to world-class cardiac facilities proved decisive'
    }
  };
  
  return examples[airportCode]?.[emergencyType];
}

function calculateSuitabilityScore(outcome: DiversionOutcome, context: ScenarioContext): number {
  let score = 0;
  
  // Medical outcome is most important
  if (outcome.consequences.medicalOutcome === 'excellent') score += 40;
  else if (outcome.consequences.medicalOutcome === 'good') score += 30;
  else if (outcome.consequences.medicalOutcome === 'stable') score += 15;
  
  // Distance and time factors
  if (outcome.distance < 100) score += 20;
  else if (outcome.distance < 200) score += 15;
  else if (outcome.distance < 300) score += 10;
  
  // Fuel safety
  if (outcome.fuelRemaining > 5000) score += 15;
  else if (outcome.fuelRemaining > 3000) score += 10;
  else if (outcome.fuelRemaining > 1000) score += 5;
  
  // Weather and approach
  if (outcome.weatherConditions === 'good') score += 10;
  else if (outcome.weatherConditions === 'marginal') score += 5;
  
  if (outcome.approachDifficulty === 'easy') score += 10;
  else if (outcome.approachDifficulty === 'moderate') score += 5;
  
  // Crew workload
  if (outcome.consequences.crewWorkload === 'low') score += 10;
  else if (outcome.consequences.crewWorkload === 'moderate') score += 5;
  
  return score;
}