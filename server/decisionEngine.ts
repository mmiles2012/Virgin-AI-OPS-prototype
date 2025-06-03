import { FlightSimulationEngine, FlightState } from './flightSimulation';
import { ScenarioEngine, ScenarioState } from './scenarioEngine';
import { airports, findNearestAirports } from '../client/src/lib/airportData';
import { boeing787Specs } from '../client/src/lib/boeing787Specs';

export interface DecisionOption {
  id: string;
  title: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  costImpact: number; // USD
  timeImpact: number; // minutes
  safetyScore: number; // 0-100
  feasibility: number; // 0-100
  consequences: {
    fuel: number;
    passengers: number;
    crew: number;
    operational: number;
  };
  requirements: string[];
}

export interface DecisionContext {
  timestamp: Date;
  flightState: FlightState;
  scenarioState: ScenarioState;
  availableOptions: DecisionOption[];
  timeToDecision: number; // seconds
  stakeholders: {
    crew: boolean;
    operations: boolean;
    medical: boolean;
    atc: boolean;
  };
  constraints: {
    fuelLimits: boolean;
    weatherLimits: boolean;
    airspaceLimits: boolean;
    medicalUrgency: boolean;
  };
}

export interface DecisionOutcome {
  chosenOption: DecisionOption;
  decisionMaker: 'crew' | 'operations' | 'ai' | 'collaborative';
  responseTime: number;
  confidence: number;
  actualCost: number;
  actualTime: number;
  safetyOutcome: 'excellent' | 'good' | 'acceptable' | 'poor';
  lessons: string[];
}

export class DecisionEngine {
  private flightSim: FlightSimulationEngine;
  private scenarioEngine: ScenarioEngine;
  private currentContext: DecisionContext | null = null;
  private decisionHistory: DecisionOutcome[] = [];
  private analysisWeights = {
    safety: 0.4,
    cost: 0.2,
    time: 0.2,
    feasibility: 0.2
  };

  constructor(flightSim: FlightSimulationEngine, scenarioEngine: ScenarioEngine) {
    this.flightSim = flightSim;
    this.scenarioEngine = scenarioEngine;
  }

  public generateDecisionContext(): DecisionContext | null {
    const flightState = this.flightSim.getFlightState();
    const scenarioState = this.scenarioEngine.getScenarioState();

    // Only generate context if there's an active scenario requiring decisions
    if (!scenarioState.active || !this.requiresDecision(flightState, scenarioState)) {
      return null;
    }

    const options = this.generateDecisionOptions(flightState, scenarioState);
    const timeLimit = this.calculateDecisionTimeLimit(flightState, scenarioState);

    this.currentContext = {
      timestamp: new Date(),
      flightState,
      scenarioState,
      availableOptions: options,
      timeToDecision: timeLimit,
      stakeholders: this.identifyStakeholders(scenarioState),
      constraints: this.analyzeConstraints(flightState, scenarioState)
    };

    return this.currentContext;
  }

  private requiresDecision(flightState: FlightState, scenarioState: ScenarioState): boolean {
    // Check if current scenario has pending decision points
    if (scenarioState.currentDecisionPoint) {
      return true;
    }

    // Check for emergency conditions requiring immediate decisions
    if (flightState.emergency.declared) {
      return true;
    }

    // Check for system warnings that may require decisions
    const warnings = this.analyzeSystemWarnings(flightState);
    return warnings.some(warning => warning.requiresDecision);
  }

  private generateDecisionOptions(flightState: FlightState, scenarioState: ScenarioState): DecisionOption[] {
    const options: DecisionOption[] = [];
    const currentPos = flightState.position;

    // If medical emergency, generate diversion options
    if (flightState.emergency.type === 'medical' || scenarioState.currentScenario?.type === 'medical') {
      const nearbyAirports = findNearestAirports(currentPos.lat, currentPos.lon, 5);
      
      nearbyAirports.forEach((airport, index) => {
        const distance = this.calculateDistance(currentPos.lat, currentPos.lon, airport.lat, airport.lon);
        const flightTime = distance / (flightState.airspeed || 450); // hours
        const fuelRequired = flightTime * 3000; // kg/hour approximate
        
        options.push({
          id: `divert_${airport.icao}`,
          title: `Divert to ${airport.icao}`,
          description: `Emergency landing at ${airport.name}`,
          riskLevel: airport.medicalFacilities ? 'medium' : 'high',
          costImpact: this.calculateDiversionCost(distance, flightTime),
          timeImpact: flightTime * 60,
          safetyScore: this.calculateSafetyScore(airport, 'medical'),
          feasibility: this.calculateFeasibility(airport, flightState, distance),
          consequences: {
            fuel: fuelRequired,
            passengers: 280, // affected passengers
            crew: 15,
            operational: this.calculateOperationalImpact(distance)
          },
          requirements: [
            'ATC clearance',
            'Ground medical team',
            airport.medicalFacilities ? 'Hospital coordination' : 'Medical transport arrangement'
          ]
        });
      });
    }

    // Continue to destination option
    if (flightState.fuelRemaining > 50000 && !this.isCriticalEmergency(scenarioState)) {
      options.push({
        id: 'continue_destination',
        title: 'Continue to Destination',
        description: 'Proceed with original flight plan',
        riskLevel: flightState.emergency.declared ? 'high' : 'low',
        costImpact: 0,
        timeImpact: 0,
        safetyScore: flightState.emergency.declared ? 30 : 90,
        feasibility: this.calculateContinueFeasibility(flightState),
        consequences: {
          fuel: 0,
          passengers: flightState.emergency.declared ? -50 : 0, // negative means risk
          crew: 0,
          operational: 0
        },
        requirements: ['Monitor patient condition', 'Prepare for landing']
      });
    }

    // Holding pattern option for non-critical situations
    if (!this.isCriticalEmergency(scenarioState)) {
      options.push({
        id: 'hold_assess',
        title: 'Enter Holding Pattern',
        description: 'Circle current position to assess situation',
        riskLevel: 'medium',
        costImpact: 15000, // fuel cost
        timeImpact: 30,
        safetyScore: 70,
        feasibility: 85,
        consequences: {
          fuel: 2000, // kg
          passengers: 10, // discomfort
          crew: 5,
          operational: 5000
        },
        requirements: ['ATC coordination', 'Medical assessment', 'Fuel monitoring']
      });
    }

    return options.sort((a, b) => this.calculateOptionScore(b) - this.calculateOptionScore(a));
  }

  private calculateOptionScore(option: DecisionOption): number {
    const safetyScore = option.safetyScore * this.analysisWeights.safety;
    const costScore = (100 - Math.min(option.costImpact / 1000, 100)) * this.analysisWeights.cost;
    const timeScore = (100 - Math.min(option.timeImpact / 10, 100)) * this.analysisWeights.time;
    const feasibilityScore = option.feasibility * this.analysisWeights.feasibility;
    
    return safetyScore + costScore + timeScore + feasibilityScore;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3440.065; // Earth's radius in nautical miles
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private calculateDiversionCost(distance: number, flightTime: number): number {
    const fuelCost = distance * 2.5 * 5.5; // distance * fuel burn * fuel price
    const timeCost = flightTime * 1500; // hourly operational cost
    const passengerCost = 50000; // medical emergency compensation
    const groundCost = 5000; // landing fees and ground handling
    return fuelCost + timeCost + passengerCost + groundCost;
  }

  private calculateSafetyScore(airport: any, emergencyType: string): number {
    let score = 50; // base score
    
    if (airport.medicalFacilities) score += 30;
    if (airport.emergencyServices.medical) score += 20;
    if (airport.emergencyServices.fireRescue) score += 15;
    if (airport.runwayLength >= 10000) score += 10;
    if (airport.operatingHours === '24/7') score += 10;
    
    return Math.min(score, 100);
  }

  private calculateFeasibility(airport: any, flightState: FlightState, distance: number): number {
    let score = 100;
    
    // Fuel feasibility
    const fuelRequired = (distance / (flightState.airspeed || 450)) * 3000;
    if (fuelRequired > flightState.fuelRemaining * 0.8) score -= 40;
    else if (fuelRequired > flightState.fuelRemaining * 0.6) score -= 20;
    
    // Runway feasibility
    if (airport.runwayLength < boeing787Specs.operationalLimits.minRunwayLength) score -= 50;
    
    // Weather feasibility (simplified)
    if (Math.random() > 0.8) score -= 15; // 20% chance of weather issues
    
    return Math.max(score, 0);
  }

  private calculateContinueFeasibility(flightState: FlightState): number {
    let score = 100;
    
    if (flightState.emergency.declared) score -= 50;
    if (flightState.fuelRemaining < 80000) score -= 20;
    
    // Check system warnings
    const systemWarnings = this.analyzeSystemWarnings(flightState);
    score -= systemWarnings.length * 10;
    
    return Math.max(score, 0);
  }

  private calculateOperationalImpact(distance: number): number {
    return distance * 100; // simplified operational cost per nautical mile
  }

  private isCriticalEmergency(scenarioState: ScenarioState): boolean {
    return scenarioState.currentScenario?.severity === 'high' || 
           scenarioState.currentScenario?.title.toLowerCase().includes('cardiac');
  }

  private calculateDecisionTimeLimit(flightState: FlightState, scenarioState: ScenarioState): number {
    if (this.isCriticalEmergency(scenarioState)) return 300; // 5 minutes
    if (flightState.emergency.declared) return 600; // 10 minutes
    return 1200; // 20 minutes for normal decisions
  }

  private identifyStakeholders(scenarioState: ScenarioState) {
    return {
      crew: true,
      operations: true,
      medical: scenarioState.currentScenario?.type === 'medical' || false,
      atc: true
    };
  }

  private analyzeConstraints(flightState: FlightState, scenarioState: ScenarioState) {
    return {
      fuelLimits: flightState.fuelRemaining < 100000,
      weatherLimits: false, // simplified
      airspaceLimits: false, // simplified
      medicalUrgency: this.isCriticalEmergency(scenarioState)
    };
  }

  private analyzeSystemWarnings(flightState: FlightState): Array<{warning: string, requiresDecision: boolean}> {
    const warnings = [];
    
    if (flightState.fuelRemaining < 50000) {
      warnings.push({warning: 'LOW FUEL', requiresDecision: true});
    }
    
    if (flightState.airspeed > 550) {
      warnings.push({warning: 'OVERSPEED', requiresDecision: false});
    }
    
    if (flightState.position.altitude > 43000) {
      warnings.push({warning: 'ALTITUDE LIMIT EXCEEDED', requiresDecision: false});
    }
    
    return warnings;
  }

  public makeAIRecommendation(context: DecisionContext): DecisionOption {
    // AI recommendation based on weighted scoring
    return context.availableOptions[0]; // highest scored option
  }

  public recordDecision(option: DecisionOption, decisionMaker: string, responseTime: number): DecisionOutcome {
    const outcome: DecisionOutcome = {
      chosenOption: option,
      decisionMaker: decisionMaker as any,
      responseTime,
      confidence: this.calculateDecisionConfidence(option),
      actualCost: option.costImpact * (0.8 + Math.random() * 0.4), // ±20% variance
      actualTime: option.timeImpact * (0.9 + Math.random() * 0.2), // ±10% variance
      safetyOutcome: this.calculateSafetyOutcome(option),
      lessons: this.generateLessons(option)
    };

    this.decisionHistory.push(outcome);
    return outcome;
  }

  private calculateDecisionConfidence(option: DecisionOption): number {
    return Math.min(95, (option.safetyScore + option.feasibility) / 2 + Math.random() * 10);
  }

  private calculateSafetyOutcome(option: DecisionOption): 'excellent' | 'good' | 'acceptable' | 'poor' {
    const score = option.safetyScore + (Math.random() - 0.5) * 20;
    if (score >= 85) return 'excellent';
    if (score >= 70) return 'good';
    if (score >= 50) return 'acceptable';
    return 'poor';
  }

  private generateLessons(option: DecisionOption): string[] {
    const lessons = [];
    
    if (option.riskLevel === 'high') {
      lessons.push('High-risk decisions require additional crew coordination');
    }
    
    if (option.timeImpact > 60) {
      lessons.push('Consider passenger communication for extended delays');
    }
    
    if (option.costImpact > 50000) {
      lessons.push('Major cost impacts require operations center approval');
    }
    
    return lessons;
  }

  public getCurrentContext(): DecisionContext | null {
    return this.currentContext;
  }

  public getDecisionHistory(): DecisionOutcome[] {
    return this.decisionHistory;
  }

  public getPerformanceMetrics() {
    if (this.decisionHistory.length === 0) {
      return {
        averageResponseTime: 0,
        safetySuccessRate: 0,
        costEfficiency: 0,
        decisionAccuracy: 0
      };
    }

    const avgResponseTime = this.decisionHistory.reduce((sum, d) => sum + d.responseTime, 0) / this.decisionHistory.length;
    const safetySuccesses = this.decisionHistory.filter(d => ['excellent', 'good'].includes(d.safetyOutcome)).length;
    const avgCostVariance = this.decisionHistory.reduce((sum, d) => sum + Math.abs(d.actualCost - d.chosenOption.costImpact), 0) / this.decisionHistory.length;
    const avgConfidence = this.decisionHistory.reduce((sum, d) => sum + d.confidence, 0) / this.decisionHistory.length;

    return {
      averageResponseTime: avgResponseTime,
      safetySuccessRate: (safetySuccesses / this.decisionHistory.length) * 100,
      costEfficiency: Math.max(0, 100 - (avgCostVariance / 1000)),
      decisionAccuracy: avgConfidence
    };
  }
}