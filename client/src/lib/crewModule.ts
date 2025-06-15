export interface CrewLegalityCheck {
  legal: boolean;
  timeRemaining: number;
  requiredTime: number;
  safetyMargin: number;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface CrewDutyRegulations {
  maxFlightDuty: number; // minutes
  maxDutyPeriod: number; // minutes
  minimumRest: number; // hours
  extensionLimits: {
    discretionary: number; // minutes
    commander: number; // minutes
    operational: number; // minutes
  };
}

export class CrewModule {
  // EU FTL regulations (simplified)
  private static readonly EU_FTL_REGULATIONS: CrewDutyRegulations = {
    maxFlightDuty: 900, // 15 hours max
    maxDutyPeriod: 840, // 14 hours standard
    minimumRest: 12, // hours
    extensionLimits: {
      discretionary: 120, // 2 hours discretionary
      commander: 60, // 1 hour commander extension
      operational: 180 // 3 hours max operational extension
    }
  };

  /**
   * Check if crew is legal for operation
   */
  static isCrewLegal(minutesRemaining: number, estimatedExtension: number): boolean {
    return minutesRemaining >= estimatedExtension;
  }

  /**
   * Comprehensive crew legality status check
   */
  static checkLegalityStatus(
    minutesRemaining: number,
    scenarioExtension: number,
    currentDutyTime: number = 0
  ): CrewLegalityCheck {
    const legal = this.isCrewLegal(minutesRemaining, scenarioExtension);
    const safetyMargin = minutesRemaining - scenarioExtension;
    const recommendations: string[] = [];
    
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';

    // Generate recommendations based on remaining time
    if (safetyMargin < 30) {
      riskLevel = 'critical';
      recommendations.push('CRITICAL: Crew approaching maximum duty limits');
      recommendations.push('Consider crew replacement or immediate landing');
    } else if (safetyMargin < 60) {
      riskLevel = 'high';
      recommendations.push('HIGH RISK: Very limited crew time remaining');
      recommendations.push('Minimize delays and prepare for expedited operations');
    } else if (safetyMargin < 120) {
      riskLevel = 'medium';
      recommendations.push('CAUTION: Monitor crew duty time closely');
      recommendations.push('Avoid unnecessary delays');
    } else {
      recommendations.push('Crew duty time within normal limits');
    }

    // Check if extension would be required
    if (scenarioExtension > 0) {
      const extensionType = this.determineExtensionType(scenarioExtension);
      recommendations.push(`Extension required: ${extensionType}`);
      
      if (extensionType === 'Not permitted') {
        riskLevel = 'critical';
        recommendations.push('Extension exceeds regulatory limits');
      }
    }

    return {
      legal,
      timeRemaining: minutesRemaining,
      requiredTime: scenarioExtension,
      safetyMargin,
      recommendations,
      riskLevel
    };
  }

  /**
   * Determine what type of extension would be required
   */
  private static determineExtensionType(extensionMinutes: number): string {
    if (extensionMinutes <= this.EU_FTL_REGULATIONS.extensionLimits.commander) {
      return 'Commander discretionary';
    } else if (extensionMinutes <= this.EU_FTL_REGULATIONS.extensionLimits.discretionary) {
      return 'Discretionary extension';
    } else if (extensionMinutes <= this.EU_FTL_REGULATIONS.extensionLimits.operational) {
      return 'Operational extension (requires approval)';
    } else {
      return 'Not permitted';
    }
  }

  /**
   * Calculate crew replacement requirements
   */
  static calculateCrewReplacement(
    currentLocation: string,
    diversionAirport: string,
    remainingDutyTime: number
  ): {
    required: boolean;
    estimatedTime: number;
    cost: number;
    logistics: string[];
  } {
    const required = remainingDutyTime < 120; // Less than 2 hours
    let estimatedTime = 0;
    let cost = 0;
    const logistics: string[] = [];

    if (required) {
      // Estimate crew positioning time
      if (currentLocation === diversionAirport) {
        estimatedTime = 180; // 3 hours local crew
        cost = 5000;
        logistics.push('Contact local crew scheduling');
        logistics.push('Arrange crew transportation to aircraft');
      } else {
        estimatedTime = 360; // 6 hours for positioning
        cost = 15000;
        logistics.push('Position replacement crew from base');
        logistics.push('Arrange crew transportation and accommodation');
        logistics.push('Coordinate with crew scheduling and operations');
      }

      logistics.push('Arrange passenger accommodation if overnight');
      logistics.push('Notify maintenance for extended ground time');
    }

    return {
      required,
      estimatedTime,
      cost,
      logistics
    };
  }

  /**
   * Monitor crew fatigue indicators
   */
  static assessCrewFatigue(
    dutyStartTime: string,
    currentTime: string,
    flightSegments: number,
    lastRestPeriod: number // hours
  ): {
    fatigueLevel: 'low' | 'moderate' | 'high' | 'severe';
    indicators: string[];
    recommendations: string[];
  } {
    const dutyHours = (new Date(currentTime).getTime() - new Date(dutyStartTime).getTime()) / (1000 * 60 * 60);
    const indicators: string[] = [];
    const recommendations: string[] = [];
    
    let fatigueLevel: 'low' | 'moderate' | 'high' | 'severe' = 'low';

    // Assess duty time
    if (dutyHours > 12) {
      fatigueLevel = 'high';
      indicators.push(`Extended duty time: ${dutyHours.toFixed(1)} hours`);
    } else if (dutyHours > 10) {
      fatigueLevel = 'moderate';
      indicators.push(`Long duty period: ${dutyHours.toFixed(1)} hours`);
    }

    // Assess flight segments
    if (flightSegments > 4) {
      indicators.push(`Multiple sectors: ${flightSegments} flights`);
      fatigueLevel = fatigueLevel === 'low' ? 'moderate' : 'high';
    }

    // Assess rest period
    if (lastRestPeriod < 10) {
      indicators.push(`Reduced rest: ${lastRestPeriod} hours`);
      fatigueLevel = fatigueLevel === 'low' ? 'moderate' : 'high';
    }

    // Generate recommendations
    if (fatigueLevel === 'high' || fatigueLevel === 'severe') {
      recommendations.push('Consider crew replacement');
      recommendations.push('Monitor crew performance closely');
      recommendations.push('Minimize non-essential workload');
    } else if (fatigueLevel === 'moderate') {
      recommendations.push('Monitor crew alertness');
      recommendations.push('Consider controlled rest if possible');
    }

    return {
      fatigueLevel,
      indicators,
      recommendations
    };
  }

  /**
   * Calculate crew costs for various scenarios
   */
  static calculateCrewCosts(scenario: {
    overtimeHours: number;
    accommodationNights: number;
    positioning: boolean;
    replacement: boolean;
    location: 'domestic' | 'european' | 'longhaul';
  }): {
    overtime: number;
    accommodation: number;
    positioning: number;
    replacement: number;
    total: number;
  } {
    const rates = {
      overtimeHourly: 120, // USD per hour
      accommodationNightly: {
        domestic: 150,
        european: 200,
        longhaul: 300
      },
      positioning: 2500, // Fixed cost
      replacement: 8000 // Fixed cost for crew replacement
    };

    const overtime = scenario.overtimeHours * rates.overtimeHourly;
    const accommodation = scenario.accommodationNights * rates.accommodationNightly[scenario.location];
    const positioning = scenario.positioning ? rates.positioning : 0;
    const replacement = scenario.replacement ? rates.replacement : 0;

    return {
      overtime,
      accommodation,
      positioning,
      replacement,
      total: overtime + accommodation + positioning + replacement
    };
  }

  /**
   * Generate crew duty report
   */
  static generateCrewDutyReport(
    flightNumber: string,
    crewMembers: Array<{
      name: string;
      position: string;
      dutyStart: string;
      currentDuty: number;
      extensionsUsed: number;
    }>
  ): string {
    const report = [`Crew Duty Report - Flight ${flightNumber}`, '='.repeat(50)];
    
    crewMembers.forEach(crew => {
      const dutyHours = Math.floor(crew.currentDuty / 60);
      const dutyMinutes = crew.currentDuty % 60;
      
      report.push(`${crew.position}: ${crew.name}`);
      report.push(`  Duty Start: ${crew.dutyStart}`);
      report.push(`  Current Duty: ${dutyHours}h ${dutyMinutes}m`);
      report.push(`  Extensions Used: ${crew.extensionsUsed} minutes`);
      report.push('');
    });

    const maxDuty = Math.max(...crewMembers.map(c => c.currentDuty));
    const totalExtensions = crewMembers.reduce((sum, c) => sum + c.extensionsUsed, 0);

    report.push('Summary:');
    report.push(`  Maximum Duty Time: ${Math.floor(maxDuty / 60)}h ${maxDuty % 60}m`);
    report.push(`  Total Extensions: ${totalExtensions} minutes`);
    
    if (maxDuty > 720) { // 12 hours
      report.push('  STATUS: CAUTION - Extended duty time');
    } else {
      report.push('  STATUS: Normal operations');
    }

    return report.join('\n');
  }
}