import { Flight, FlightModel } from './flightModel';

export interface DiversionResult {
  originalEta: string;
  newEta: string;
  diversionAirport: string;
  fuelRemaining: number;
  crewTimeRemaining: number;
  status: FlightModel['status'];
  diversionReason: string;
  totalDelay: number; // minutes
  additionalCosts: {
    fuel: number;
    handling: number;
    passenger: number;
    crew: number;
    total: number;
  };
  operationalImpact: {
    downstreamFlights: number;
    slotLoss: boolean;
    recoveryTime: number;
  };
  riskAssessment: {
    fuel: 'low' | 'medium' | 'high' | 'critical';
    crew: 'low' | 'medium' | 'high' | 'critical';
    operational: 'low' | 'medium' | 'high' | 'critical';
    overall: 'low' | 'medium' | 'high' | 'critical';
  };
}

export interface DiversionScenario {
  airport: string;
  airportName: string;
  distance: number; // km
  estimatedFlightTime: number; // minutes
  extraFuelBurn: number; // kg
  crewTimeUsed: number; // minutes
  reason: string;
  urgency: 'routine' | 'urgent' | 'emergency' | 'critical';
  weatherSuitability: 'excellent' | 'good' | 'marginal' | 'poor';
  facilitiesRating: 'excellent' | 'good' | 'basic' | 'limited';
}

export class ScenarioEngine {
  
  static simulateDiversion(
    flight: Flight, 
    scenario: DiversionScenario
  ): DiversionResult {
    
    const originalEta = flight.eta;
    const currentTime = new Date();
    const diversionTime = new Date(currentTime.getTime() + scenario.estimatedFlightTime * 60000);
    const newEta = diversionTime.toISOString();

    // Calculate delay in minutes
    const originalEtaTime = new Date(originalEta);
    const totalDelay = Math.max(0, (diversionTime.getTime() - originalEtaTime.getTime()) / (1000 * 60));

    // Store original values
    const originalFuel = flight.fuelOnBoard;
    const originalCrewTime = flight.crewOnDuty;

    // Update flight with diversion parameters
    flight.updateEta(newEta);
    flight.updateFuelOnBoard(flight.fuelOnBoard - scenario.extraFuelBurn);
    flight.updateCrewDuty(flight.crewOnDuty - scenario.crewTimeUsed);
    flight.updateStatus('Diverted');

    // Calculate additional costs
    const additionalCosts = this.calculateDiversionCosts(
      scenario.distance,
      scenario.extraFuelBurn,
      totalDelay,
      scenario.urgency
    );

    // Assess operational impact
    const operationalImpact = this.assessOperationalImpact(
      totalDelay,
      scenario.urgency,
      flight.aircraftType
    );

    // Perform risk assessment
    const riskAssessment = this.assessDiversionRisks(
      flight.fuelOnBoard,
      flight.crewOnDuty,
      scenario,
      operationalImpact
    );

    return {
      originalEta,
      newEta,
      diversionAirport: scenario.airport,
      fuelRemaining: flight.fuelOnBoard,
      crewTimeRemaining: flight.crewOnDuty,
      status: flight.status,
      diversionReason: scenario.reason,
      totalDelay,
      additionalCosts,
      operationalImpact,
      riskAssessment
    };
  }

  private static calculateDiversionCosts(
    distance: number,
    extraFuelBurn: number,
    delayMinutes: number,
    urgency: string
  ) {
    // Fuel costs (assuming $0.80 per kg)
    const fuelCost = extraFuelBurn * 0.80;

    // Ground handling costs
    const handlingCost = urgency === 'emergency' ? 8000 : 
                        urgency === 'urgent' ? 5000 : 3000;

    // Passenger compensation (EU261 and delay-based)
    let passengerCost = 0;
    if (delayMinutes > 180) {
      passengerCost = delayMinutes > 300 ? 25000 : 15000;
    }

    // Crew costs (overtime, hotel, positioning)
    const crewCost = delayMinutes > 240 ? 4000 : 
                     delayMinutes > 120 ? 2000 : 500;

    return {
      fuel: Math.round(fuelCost),
      handling: handlingCost,
      passenger: passengerCost,
      crew: crewCost,
      total: Math.round(fuelCost + handlingCost + passengerCost + crewCost)
    };
  }

  private static assessOperationalImpact(
    delayMinutes: number,
    urgency: string,
    aircraftType: string
  ) {
    // Calculate downstream flight impacts
    const downstreamFlights = delayMinutes > 180 ? 
      Math.ceil(delayMinutes / 120) : 0;

    // Determine if slot will be lost
    const slotLoss = delayMinutes > 240 || urgency === 'emergency';

    // Estimate recovery time
    let recoveryTime = delayMinutes;
    if (urgency === 'emergency') {
      recoveryTime *= 1.5; // Emergency procedures take longer
    }

    return {
      downstreamFlights,
      slotLoss,
      recoveryTime: Math.round(recoveryTime)
    };
  }

  private static assessDiversionRisks(
    fuelRemaining: number,
    crewTimeRemaining: number,
    scenario: DiversionScenario,
    operationalImpact: any
  ) {
    // Fuel risk assessment
    let fuelRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (fuelRemaining < 8000) fuelRisk = 'critical';
    else if (fuelRemaining < 12000) fuelRisk = 'high';
    else if (fuelRemaining < 18000) fuelRisk = 'medium';

    // Crew duty risk assessment
    let crewRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (crewTimeRemaining < 30) crewRisk = 'critical';
    else if (crewTimeRemaining < 60) crewRisk = 'high';
    else if (crewTimeRemaining < 120) crewRisk = 'medium';

    // Operational risk assessment
    let operationalRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    if (operationalImpact.downstreamFlights > 3) operationalRisk = 'high';
    else if (operationalImpact.downstreamFlights > 1) operationalRisk = 'medium';
    
    if (scenario.weatherSuitability === 'poor') {
      operationalRisk = operationalRisk === 'high' ? 'critical' : 'high';
    }

    // Overall risk assessment
    const risks = [fuelRisk, crewRisk, operationalRisk];
    let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    if (risks.includes('critical')) overallRisk = 'critical';
    else if (risks.includes('high')) overallRisk = 'high';
    else if (risks.includes('medium')) overallRisk = 'medium';

    return {
      fuel: fuelRisk,
      crew: crewRisk,
      operational: operationalRisk,
      overall: overallRisk
    };
  }

  static generateDiversionScenarios(
    flight: Flight,
    emergencyType: string
  ): DiversionScenario[] {
    const scenarios: DiversionScenario[] = [];

    // Medical emergency scenarios
    if (emergencyType === 'medical') {
      scenarios.push({
        airport: 'EGLL',
        airportName: 'London Heathrow',
        distance: 180,
        estimatedFlightTime: 25,
        extraFuelBurn: 2800,
        crewTimeUsed: 45,
        reason: 'Medical emergency - passenger requires immediate hospital care',
        urgency: 'emergency',
        weatherSuitability: 'excellent',
        facilitiesRating: 'excellent'
      });

      scenarios.push({
        airport: 'EHAM',
        airportName: 'Amsterdam Schiphol',
        distance: 220,
        estimatedFlightTime: 32,
        extraFuelBurn: 3200,
        crewTimeUsed: 55,
        reason: 'Medical emergency - alternate with medical facilities',
        urgency: 'emergency',
        weatherSuitability: 'good',
        facilitiesRating: 'excellent'
      });
    }

    // Technical emergency scenarios
    if (emergencyType === 'technical') {
      scenarios.push({
        airport: 'EDDF',
        airportName: 'Frankfurt Main',
        distance: 320,
        estimatedFlightTime: 45,
        extraFuelBurn: 4200,
        crewTimeUsed: 70,
        reason: 'Engine parameter abnormality - precautionary landing',
        urgency: 'urgent',
        weatherSuitability: 'good',
        facilitiesRating: 'excellent'
      });

      scenarios.push({
        airport: 'LFPG',
        airportName: 'Paris Charles de Gaulle',
        distance: 290,
        estimatedFlightTime: 40,
        extraFuelBurn: 3800,
        crewTimeUsed: 65,
        reason: 'Technical issue - maintenance required',
        urgency: 'urgent',
        weatherSuitability: 'excellent',
        facilitiesRating: 'good'
      });
    }

    // Weather diversion scenarios
    if (emergencyType === 'weather') {
      scenarios.push({
        airport: 'ESSA',
        airportName: 'Stockholm Arlanda',
        distance: 450,
        estimatedFlightTime: 60,
        extraFuelBurn: 5400,
        crewTimeUsed: 85,
        reason: 'Severe weather at destination - holding not possible',
        urgency: 'routine',
        weatherSuitability: 'excellent',
        facilitiesRating: 'good'
      });
    }

    return scenarios.filter(scenario => 
      flight.canCompleteDiversion(scenario.estimatedFlightTime) &&
      flight.canAcceptDiversion(scenario.crewTimeUsed)
    );
  }

  static validateDiversionFeasibility(
    flight: Flight,
    scenario: DiversionScenario
  ): { feasible: boolean; limitations: string[] } {
    const limitations: string[] = [];

    // Check fuel constraints
    if (!flight.canCompleteDiversion(scenario.estimatedFlightTime)) {
      limitations.push('Insufficient fuel for diversion');
    }

    // Check crew duty constraints
    if (!flight.canAcceptDiversion(scenario.crewTimeUsed)) {
      limitations.push('Crew duty time limitations');
    }

    // Check fuel criticality after diversion
    const fuelAfterDiversion = flight.fuelOnBoard - scenario.extraFuelBurn;
    if (fuelAfterDiversion < 8000) {
      limitations.push('Post-diversion fuel state critical');
    }

    // Check crew time after diversion
    const crewTimeAfter = flight.crewOnDuty - scenario.crewTimeUsed;
    if (crewTimeAfter < 60) {
      limitations.push('Crew approaching maximum duty time');
    }

    return {
      feasible: limitations.length === 0,
      limitations
    };
  }
}