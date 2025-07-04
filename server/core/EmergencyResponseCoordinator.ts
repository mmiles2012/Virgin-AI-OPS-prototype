/**
 * Emergency Response Coordinator for AINO Aviation Intelligence Platform
 * Consolidates emergency detection, classification, and response from 13 overlapping files
 */

import { scoreDecision, evaluateConstraints, DecisionFactors } from '../utils/decisionMath';

export interface EmergencyScenario {
  id: string;
  type: 'medical' | 'technical' | 'security' | 'weather' | 'fuel' | 'pressurization' | 'fire';
  severity: 'low' | 'medium' | 'high' | 'critical';
  flightNumber: string;
  aircraftType: string;
  position: {
    lat: number;
    lon: number;
    altitude: number;
  };
  fuel: {
    remaining: number;
    endurance: number; // minutes
  };
  passengers: number;
  crew: number;
  timestamp: Date;
  description: string;
  requiresImmediate: boolean;
  diversionRequired: boolean;
}

export interface EmergencyResponse {
  scenario: EmergencyScenario;
  recommendedActions: EmergencyAction[];
  diversionOptions: DiversionOption[];
  communicationPlan: CommunicationPlan;
  resourceRequirements: ResourceRequirements;
  decisionScore: number;
  estimatedCost: number;
  riskAssessment: RiskAssessment;
}

export interface EmergencyAction {
  id: string;
  action: string;
  priority: 'immediate' | 'high' | 'medium' | 'low';
  assignedTo: 'crew' | 'atc' | 'operations' | 'medical' | 'ground';
  estimatedTime: number; // minutes
  dependencies: string[];
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
}

export interface DiversionOption {
  airport: {
    icao: string;
    name: string;
    lat: number;
    lon: number;
  };
  distance: number; // nautical miles
  flightTime: number; // minutes
  fuelRequired: number; // kg
  suitabilityScore: number; // 0-100
  capabilities: {
    medicalFacilities: boolean;
    fireRescue: boolean;
    maintenanceCapable: boolean;
    runwayLength: number;
    operatingHours: string;
  };
  cost: {
    fuel: number;
    landing: number;
    ground: number;
    passenger: number;
    total: number;
  };
}

export interface CommunicationPlan {
  notifications: Array<{
    recipient: 'atc' | 'operations' | 'medical' | 'passengers' | 'crew' | 'ground';
    message: string;
    priority: 'immediate' | 'urgent' | 'normal';
    method: 'radio' | 'acars' | 'satcom' | 'phone' | 'email';
  }>;
  squawkCode?: string;
  emergencyFrequency?: string;
}

export interface ResourceRequirements {
  ground: {
    medical: boolean;
    fireRescue: boolean;
    maintenance: boolean;
    security: boolean;
  };
  equipment: string[];
  personnel: Array<{
    type: string;
    count: number;
    specialization?: string;
  }>;
}

export interface RiskAssessment {
  overallRisk: 'low' | 'medium' | 'high' | 'critical';
  factors: Array<{
    factor: string;
    impact: number; // 0-100
    mitigation: string;
  }>;
  timeConstraints: {
    decisionWindow: number; // minutes
    actionWindow: number; // minutes
  };
}

export class EmergencyResponseCoordinator {
  private activeEmergencies: Map<string, EmergencyResponse> = new Map();
  private responseHistory: EmergencyResponse[] = [];
  
  private readonly decisionWeights = {
    safety: 0.50,
    cost: 0.15,
    time: 0.20,
    feasibility: 0.15
  };

  /**
   * Detect and classify emergency scenarios from flight state
   */
  public detectEmergency(flightState: any, additionalData?: any): EmergencyScenario | null {
    const emergencies: Partial<EmergencyScenario>[] = [];

    // Medical emergency detection
    if (this.detectMedicalEmergency(flightState, additionalData)) {
      emergencies.push({
        type: 'medical',
        severity: this.assessMedicalSeverity(additionalData),
        requiresImmediate: true,
        diversionRequired: true,
        description: 'Passenger medical emergency detected'
      });
    }

    // Technical emergency detection
    if (this.detectTechnicalEmergency(flightState)) {
      emergencies.push({
        type: 'technical',
        severity: this.assessTechnicalSeverity(flightState),
        requiresImmediate: true,
        diversionRequired: this.requiresTechnicalDiversion(flightState),
        description: 'Aircraft system malfunction detected'
      });
    }

    // Fuel emergency detection
    if (this.detectFuelEmergency(flightState)) {
      emergencies.push({
        type: 'fuel',
        severity: this.assessFuelSeverity(flightState),
        requiresImmediate: true,
        diversionRequired: true,
        description: 'Fuel shortage emergency'
      });
    }

    // Weather emergency detection
    if (this.detectWeatherEmergency(flightState, additionalData)) {
      emergencies.push({
        type: 'weather',
        severity: this.assessWeatherSeverity(additionalData),
        requiresImmediate: false,
        diversionRequired: this.requiresWeatherDiversion(additionalData),
        description: 'Severe weather conditions encountered'
      });
    }

    // Return most critical emergency
    if (emergencies.length === 0) return null;

    const mostCritical = emergencies.reduce((prev, curr) => 
      this.getSeverityLevel(curr.severity!) > this.getSeverityLevel(prev.severity!) ? curr : prev
    );

    return this.buildEmergencyScenario(mostCritical, flightState);
  }

  /**
   * Generate comprehensive emergency response
   */
  public generateResponse(scenario: EmergencyScenario): EmergencyResponse {
    const diversionOptions = this.generateDiversionOptions(scenario);
    const actions = this.generateEmergencyActions(scenario);
    const communication = this.generateCommunicationPlan(scenario);
    const resources = this.generateResourceRequirements(scenario);
    const risk = this.assessRisk(scenario);

    // Calculate decision score for response quality
    const decisionFactors: DecisionFactors = {
      safetyScore: this.calculateSafetyScore(scenario, diversionOptions[0]),
      costImpact: this.calculateTotalCost(diversionOptions[0]),
      timeImpact: diversionOptions[0]?.flightTime || 60,
      feasibility: diversionOptions[0]?.suitabilityScore || 50,
      riskLevel: scenario.severity
    };

    const decisionScore = scoreDecision(decisionFactors, this.decisionWeights);

    const response: EmergencyResponse = {
      scenario,
      recommendedActions: actions,
      diversionOptions,
      communicationPlan: communication,
      resourceRequirements: resources,
      decisionScore,
      estimatedCost: this.calculateTotalCost(diversionOptions[0]),
      riskAssessment: risk
    };

    this.activeEmergencies.set(scenario.id, response);
    return response;
  }

  private detectMedicalEmergency(flightState: any, additionalData?: any): boolean {
    return additionalData?.medicalAlert || 
           additionalData?.scenario?.type === 'medical' ||
           flightState.emergency?.type === 'medical';
  }

  private detectTechnicalEmergency(flightState: any): boolean {
    const systemWarnings = flightState.systemWarnings || [];
    const criticalSystems = ['engine', 'hydraulics', 'electrical', 'pressurization'];
    
    return systemWarnings.some((warning: string) => 
      criticalSystems.some(system => warning.toLowerCase().includes(system))
    ) || flightState.emergency?.type === 'technical';
  }

  private detectFuelEmergency(flightState: any): boolean {
    const fuelRemaining = flightState.fuelRemaining || 0;
    const minimumFuel = 30000; // kg
    
    return fuelRemaining < minimumFuel || 
           flightState.emergency?.type === 'fuel';
  }

  private detectWeatherEmergency(flightState: any, additionalData?: any): boolean {
    return additionalData?.severeWeather ||
           additionalData?.weatherWarnings?.includes('SEVERE') ||
           flightState.emergency?.type === 'weather';
  }

  private assessMedicalSeverity(additionalData?: any): 'low' | 'medium' | 'high' | 'critical' {
    const severity = additionalData?.medicalSeverity?.toLowerCase();
    if (severity?.includes('cardiac') || severity?.includes('stroke')) return 'critical';
    if (severity?.includes('serious') || severity?.includes('unconscious')) return 'high';
    if (severity?.includes('moderate')) return 'medium';
    return 'low';
  }

  private assessTechnicalSeverity(flightState: any): 'low' | 'medium' | 'high' | 'critical' {
    const warnings = flightState.systemWarnings || [];
    if (warnings.some((w: string) => w.includes('ENGINE') || w.includes('FIRE'))) return 'critical';
    if (warnings.some((w: string) => w.includes('HYDRAULIC') || w.includes('ELECTRICAL'))) return 'high';
    if (warnings.some((w: string) => w.includes('SYSTEM'))) return 'medium';
    return 'low';
  }

  private assessFuelSeverity(flightState: any): 'low' | 'medium' | 'high' | 'critical' {
    const fuel = flightState.fuelRemaining || 0;
    if (fuel < 15000) return 'critical';
    if (fuel < 25000) return 'high';
    if (fuel < 35000) return 'medium';
    return 'low';
  }

  private assessWeatherSeverity(additionalData?: any): 'low' | 'medium' | 'high' | 'critical' {
    const intensity = additionalData?.weatherIntensity?.toLowerCase();
    if (intensity?.includes('extreme')) return 'critical';
    if (intensity?.includes('severe')) return 'high';
    if (intensity?.includes('moderate')) return 'medium';
    return 'low';
  }

  private requiresTechnicalDiversion(flightState: any): boolean {
    const criticalWarnings = flightState.systemWarnings || [];
    return criticalWarnings.some((w: string) => 
      w.includes('ENGINE') || w.includes('FIRE') || w.includes('PRESSURIZATION')
    );
  }

  private requiresWeatherDiversion(additionalData?: any): boolean {
    return additionalData?.weatherSeverity === 'critical' ||
           additionalData?.weatherWarnings?.includes('TORNADO');
  }

  private getSeverityLevel(severity: string): number {
    const levels = { low: 1, medium: 2, high: 3, critical: 4 };
    return levels[severity as keyof typeof levels] || 1;
  }

  private buildEmergencyScenario(emergency: Partial<EmergencyScenario>, flightState: any): EmergencyScenario {
    return {
      id: `EMG_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type: emergency.type!,
      severity: emergency.severity!,
      flightNumber: flightState.flightNumber || 'UNKNOWN',
      aircraftType: flightState.aircraftType || 'Unknown',
      position: {
        lat: flightState.position?.lat || 0,
        lon: flightState.position?.lon || 0,
        altitude: flightState.position?.altitude || 0
      },
      fuel: {
        remaining: flightState.fuelRemaining || 0,
        endurance: this.calculateEndurance(flightState.fuelRemaining || 0)
      },
      passengers: flightState.passengers || 0,
      crew: flightState.crew || 0,
      timestamp: new Date(),
      description: emergency.description!,
      requiresImmediate: emergency.requiresImmediate!,
      diversionRequired: emergency.diversionRequired!
    };
  }

  private calculateEndurance(fuel: number): number {
    const fuelBurnRate = 3000; // kg/hour
    return (fuel / fuelBurnRate) * 60; // minutes
  }

  private generateDiversionOptions(scenario: EmergencyScenario): DiversionOption[] {
    // This would integrate with existing diversion services
    // For now, return sample options based on scenario type
    const baseOptions = this.getBaseDiversionOptions(scenario.position);
    
    return baseOptions
      .map(option => this.enhanceOptionForEmergency(option, scenario))
      .sort((a, b) => b.suitabilityScore - a.suitabilityScore)
      .slice(0, 3);
  }

  private getBaseDiversionOptions(position: any): any[] {
    // Sample diversion airports - would integrate with real airport database
    return [
      { icao: 'EGLL', name: 'London Heathrow', lat: 51.4775, lon: -0.4614 },
      { icao: 'EGKK', name: 'London Gatwick', lat: 51.1481, lon: -0.1903 },
      { icao: 'EGGW', name: 'London Luton', lat: 51.8747, lon: -0.3683 }
    ];
  }

  private enhanceOptionForEmergency(baseOption: any, scenario: EmergencyScenario): DiversionOption {
    const distance = this.calculateDistance(
      scenario.position.lat, scenario.position.lon,
      baseOption.lat, baseOption.lon
    );
    
    const flightTime = (distance / 450) * 60; // minutes at 450 kts
    const fuelRequired = flightTime * 50; // kg/minute fuel burn
    
    return {
      airport: baseOption,
      distance,
      flightTime,
      fuelRequired,
      suitabilityScore: this.calculateSuitabilityScore(baseOption, scenario),
      capabilities: this.getAirportCapabilities(baseOption.icao),
      cost: this.calculateDiversionCost(distance, flightTime, scenario)
    };
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

  private calculateSuitabilityScore(airport: any, scenario: EmergencyScenario): number {
    let score = 50; // base score
    
    // Medical emergency requirements
    if (scenario.type === 'medical') {
      if (airport.icao === 'EGLL') score += 40; // Major hospital nearby
      else score += 20; // Standard medical facilities
    }
    
    // Technical emergency requirements
    if (scenario.type === 'technical') {
      if (airport.icao === 'EGLL') score += 30; // Full maintenance capability
      else score += 15; // Basic maintenance
    }
    
    // Fuel emergency - any suitable airport
    if (scenario.type === 'fuel') {
      score += 25; // All major airports can handle fuel emergencies
    }
    
    return Math.min(100, score);
  }

  private getAirportCapabilities(icao: string): DiversionOption['capabilities'] {
    // Enhanced for major airports
    const enhanced = ['EGLL', 'EGKK', 'EGGW'].includes(icao);
    
    return {
      medicalFacilities: enhanced,
      fireRescue: true,
      maintenanceCapable: enhanced,
      runwayLength: enhanced ? 12000 : 8000,
      operatingHours: enhanced ? '24/7' : '06:00-22:00'
    };
  }

  private calculateDiversionCost(distance: number, flightTime: number, scenario: EmergencyScenario): DiversionOption['cost'] {
    const fuelCost = distance * 2.5 * 5.5; // distance * fuel burn * fuel price
    const timeCost = flightTime * 1500; // hourly operational cost
    const landingCost = 2000; // landing fees
    const groundCost = 5000; // ground handling
    
    // Emergency-specific costs
    let passengerCost = 0;
    if (scenario.type === 'medical') passengerCost = 50000; // medical emergency compensation
    else if (scenario.severity === 'critical') passengerCost = 25000; // general emergency compensation
    
    return {
      fuel: fuelCost,
      landing: landingCost,
      ground: groundCost,
      passenger: passengerCost,
      total: fuelCost + timeCost + landingCost + groundCost + passengerCost
    };
  }

  private generateEmergencyActions(scenario: EmergencyScenario): EmergencyAction[] {
    const actions: EmergencyAction[] = [];
    
    // Common emergency actions
    actions.push({
      id: 'DECLARE_EMERGENCY',
      action: 'Declare emergency with ATC',
      priority: 'immediate',
      assignedTo: 'crew',
      estimatedTime: 2,
      dependencies: [],
      status: 'pending'
    });

    // Scenario-specific actions
    if (scenario.type === 'medical') {
      actions.push(
        {
          id: 'MEDICAL_ASSESSMENT',
          action: 'Assess passenger condition',
          priority: 'immediate',
          assignedTo: 'crew',
          estimatedTime: 5,
          dependencies: [],
          status: 'pending'
        },
        {
          id: 'MEDICAL_GROUND',
          action: 'Request medical team at diversion airport',
          priority: 'high',
          assignedTo: 'operations',
          estimatedTime: 10,
          dependencies: ['DECLARE_EMERGENCY'],
          status: 'pending'
        }
      );
    }

    if (scenario.diversionRequired) {
      actions.push({
        id: 'REQUEST_DIVERSION',
        action: 'Request clearance for diversion',
        priority: 'immediate',
        assignedTo: 'crew',
        estimatedTime: 5,
        dependencies: ['DECLARE_EMERGENCY'],
        status: 'pending'
      });
    }

    return actions.sort((a, b) => this.getPriorityLevel(a.priority) - this.getPriorityLevel(b.priority));
  }

  private getPriorityLevel(priority: string): number {
    const levels = { immediate: 1, high: 2, medium: 3, low: 4 };
    return levels[priority as keyof typeof levels] || 4;
  }

  private generateCommunicationPlan(scenario: EmergencyScenario): CommunicationPlan {
    const notifications = [];
    
    // ATC notification
    notifications.push({
      recipient: 'atc' as const,
      message: `EMERGENCY - ${scenario.type.toUpperCase()} - ${scenario.flightNumber} - ${scenario.severity.toUpperCase()} severity`,
      priority: 'immediate' as const,
      method: 'radio' as const
    });

    // Operations center
    notifications.push({
      recipient: 'operations' as const,
      message: `Emergency declared: ${scenario.description}`,
      priority: 'immediate' as const,
      method: 'acars' as const
    });

    // Medical team (if medical emergency)
    if (scenario.type === 'medical') {
      notifications.push({
        recipient: 'medical' as const,
        message: `Medical emergency inbound - prepare for ${scenario.passengers} passengers`,
        priority: 'immediate' as const,
        method: 'phone' as const
      });
    }

    return {
      notifications,
      squawkCode: this.getEmergencySquawk(scenario.type),
      emergencyFrequency: '121.5'
    };
  }

  private getEmergencySquawk(type: string): string {
    const codes = {
      medical: '7700',
      technical: '7700',
      fuel: '7700',
      security: '7500',
      weather: '7700',
      fire: '7700',
      pressurization: '7700'
    };
    return codes[type as keyof typeof codes] || '7700';
  }

  private generateResourceRequirements(scenario: EmergencyScenario): ResourceRequirements {
    const ground = {
      medical: scenario.type === 'medical',
      fireRescue: ['technical', 'fire', 'fuel'].includes(scenario.type),
      maintenance: scenario.type === 'technical',
      security: scenario.type === 'security'
    };

    const equipment = [];
    if (scenario.type === 'medical') equipment.push('Ambulance', 'Medical Team');
    if (scenario.type === 'technical') equipment.push('Maintenance Equipment', 'Towing Vehicle');
    if (scenario.type === 'fire') equipment.push('Fire Trucks', 'Foam Equipment');

    const personnel = [
      { type: 'Airport Operations', count: 2 },
      { type: 'Ground Crew', count: 4 }
    ];

    if (scenario.type === 'medical') {
      personnel.push({ type: 'Medical Personnel', count: 3, specialization: 'Emergency Medicine' });
    }

    return { ground, equipment, personnel };
  }

  private assessRisk(scenario: EmergencyScenario): RiskAssessment {
    const factors = [
      { factor: 'Scenario Severity', impact: this.getSeverityLevel(scenario.severity) * 25, mitigation: 'Follow emergency procedures' },
      { factor: 'Fuel Availability', impact: scenario.fuel.remaining < 50000 ? 30 : 10, mitigation: 'Monitor fuel closely' },
      { factor: 'Passenger Count', impact: scenario.passengers > 200 ? 20 : 10, mitigation: 'Coordinate passenger services' }
    ];

    const avgImpact = factors.reduce((sum, f) => sum + f.impact, 0) / factors.length;
    let overallRisk: 'low' | 'medium' | 'high' | 'critical' = 'low';
    
    if (avgImpact > 75) overallRisk = 'critical';
    else if (avgImpact > 50) overallRisk = 'high';
    else if (avgImpact > 25) overallRisk = 'medium';

    const timeConstraints = {
      decisionWindow: scenario.requiresImmediate ? 5 : 15,
      actionWindow: scenario.severity === 'critical' ? 10 : 30
    };

    return { overallRisk, factors, timeConstraints };
  }

  private calculateSafetyScore(scenario: EmergencyScenario, option?: DiversionOption): number {
    let score = 50;
    
    if (option) {
      score += option.suitabilityScore * 0.4;
      if (option.capabilities.medicalFacilities && scenario.type === 'medical') score += 20;
      if (option.capabilities.maintenanceCapable && scenario.type === 'technical') score += 20;
    }
    
    // Severity penalty
    score -= this.getSeverityLevel(scenario.severity) * 10;
    
    return Math.max(20, Math.min(100, score));
  }

  private calculateTotalCost(option?: DiversionOption): number {
    return option?.cost.total || 75000; // Default emergency cost
  }

  /**
   * Get active emergency responses
   */
  public getActiveEmergencies(): EmergencyResponse[] {
    return Array.from(this.activeEmergencies.values());
  }

  /**
   * Update emergency status
   */
  public updateEmergencyStatus(emergencyId: string, actionId: string, status: string): boolean {
    const emergency = this.activeEmergencies.get(emergencyId);
    if (!emergency) return false;

    const action = emergency.recommendedActions.find(a => a.id === actionId);
    if (!action) return false;

    action.status = status as any;
    return true;
  }

  /**
   * Close emergency response
   */
  public closeEmergency(emergencyId: string): boolean {
    const emergency = this.activeEmergencies.get(emergencyId);
    if (!emergency) return false;

    this.responseHistory.push(emergency);
    this.activeEmergencies.delete(emergencyId);
    return true;
  }
}

// Singleton instance
export const emergencyCoordinator = new EmergencyResponseCoordinator();