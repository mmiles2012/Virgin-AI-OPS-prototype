import { Flight } from './flightModel';
import { DiversionResult } from './scenarioEngine';
import { DiversionCostEstimate, CustomerImpactScore } from './costModel';
import { CrewLegalityCheck } from './crewModule';
import { FuelDecisionAnalysis } from './fuelAnalytics';

export interface MORData {
  flight: Flight;
  scenarioResult: DiversionResult;
  costEstimate: DiversionCostEstimate;
  customerImpact: CustomerImpactScore;
  crewStatus: CrewLegalityCheck;
  fuelAnalysis: FuelDecisionAnalysis;
  weatherData?: any;
  notams?: any[];
}

export class ReportGenerator {
  /**
   * Generate Mandatory Occurrence Report (MOR)
   */
  static generateMOR(data: MORData): string {
    const { flight, scenarioResult } = data;
    const timestamp = new Date().toISOString();

    return `
MANDATORY OCCURRENCE REPORT (MOR)
==================================
Report ID: MOR-${flight.flightNumber}-${timestamp.slice(0, 10).replace(/-/g, '')}
Generated: ${new Date().toLocaleString('en-GB')}

FLIGHT DETAILS
--------------
Flight Number: ${flight.flightNumber}
Aircraft Type: ${flight.aircraftType}
Origin: ${flight.origin}
Scheduled Destination: ${flight.destination}
Actual Destination: ${scenarioResult.diversionAirport}

ETD: ${flight.etd}
Original ETA: ${scenarioResult.originalEta}
Actual ETA: ${scenarioResult.newEta}

DIVERSION DETAILS
-----------------
Reason: ${scenarioResult.diversionReason}
Decision Time: ${timestamp}
Total Delay: ${scenarioResult.totalDelay} minutes

AIRCRAFT STATE AT DIVERSION
---------------------------
Fuel Remaining: ${scenarioResult.fuelRemaining.toLocaleString()} kg
Crew Duty Time Remaining: ${scenarioResult.crewTimeRemaining} minutes
Aircraft Status: ${scenarioResult.status}

OPERATIONAL IMPACT
------------------
Passengers Affected: ${data.customerImpact.factors.delayMinutes > 0 ? 'Yes' : 'No'}
Delay Duration: ${data.customerImpact.factors.delayMinutes} minutes
Missed Connections: ${data.customerImpact.factors.missedConnection ? 'Yes' : 'No'}
Rerouting Required: ${data.customerImpact.factors.rerouteRequired ? 'Yes' : 'No'}

COST ANALYSIS
-------------
Direct Costs: $${data.costEstimate.total.toLocaleString()}
- Hotel Accommodation: $${data.costEstimate.hotel.toLocaleString()}
- Passenger Meals: $${data.costEstimate.meals.toLocaleString()}
- Rebooking Costs: $${data.costEstimate.rebooking.toLocaleString()}
- Crew Costs: $${data.costEstimate.breakdown.crewCosts.toLocaleString()}
- Fuel Costs: $${data.costEstimate.breakdown.fuelCosts.toLocaleString()}

CREW STATUS
-----------
Crew Legality: ${data.crewStatus.legal ? 'LEGAL' : 'EXCEEDED LIMITS'}
Safety Margin: ${data.crewStatus.safetyMargin} minutes
Risk Level: ${data.crewStatus.riskLevel.toUpperCase()}

FUEL ANALYSIS
-------------
Fuel Planning Efficiency: ${data.fuelAnalysis.efficiency}%
Fuel Waste: ${data.fuelAnalysis.wastedFuel.toLocaleString()} kg
Cost Impact: $${data.fuelAnalysis.cost}

RISK ASSESSMENT
---------------
Overall Risk: ${scenarioResult.riskAssessment.overall.toUpperCase()}
- Fuel Risk: ${scenarioResult.riskAssessment.fuel.toUpperCase()}
- Crew Risk: ${scenarioResult.riskAssessment.crew.toUpperCase()}
- Operational Risk: ${scenarioResult.riskAssessment.operational.toUpperCase()}

LESSONS LEARNED
---------------
${this.generateLessonsLearned(data)}

RECOMMENDATIONS
---------------
${this.generateRecommendations(data)}

REGULATORY NOTIFICATIONS
------------------------
- CAA Notification: Required
- Company Safety Department: Notified
- Insurance Provider: Notified
- Aircraft Manufacturer: ${scenarioResult.riskAssessment.overall === 'critical' ? 'Required' : 'Not Required'}

Report Prepared By: AINO System
Reviewed By: [To be completed by Operations Manager]
Approved By: [To be completed by Chief Pilot]

END OF REPORT
=============`;
  }

  private static generateLessonsLearned(data: MORData): string {
    const lessons: string[] = [];

    if (data.fuelAnalysis.efficiency < 85) {
      lessons.push('- Fuel planning procedures require review for improved accuracy');
    }

    if (data.crewStatus.riskLevel === 'high' || data.crewStatus.riskLevel === 'critical') {
      lessons.push('- Crew duty time management needs enhancement');
      lessons.push('- Consider crew rotation policies for extended operations');
    }

    if (data.customerImpact.score > 60) {
      lessons.push('- Customer communication protocols should be reviewed');
      lessons.push('- Passenger care arrangements need improvement');
    }

    if (data.scenarioResult.riskAssessment.overall === 'critical') {
      lessons.push('- Emergency response procedures worked effectively');
      lessons.push('- Decision-making process under pressure was appropriate');
    }

    return lessons.length > 0 ? lessons.join('\n') : '- No significant lessons identified';
  }

  private static generateRecommendations(data: MORData): string {
    const recommendations: string[] = [];

    // Fuel recommendations
    if (data.fuelAnalysis.efficiency < 90) {
      recommendations.push('- Implement dynamic fuel planning based on real-time conditions');
    }

    // Crew recommendations
    if (data.crewStatus.riskLevel !== 'low') {
      recommendations.push('- Review crew scheduling for duty time optimization');
    }

    // Operational recommendations
    if (data.scenarioResult.operationalImpact.downstreamFlights > 2) {
      recommendations.push('- Enhance recovery planning for downstream flight impacts');
    }

    // Cost recommendations
    if (data.costEstimate.total > 100000) {
      recommendations.push('- Review diversion cost mitigation strategies');
    }

    // Customer service recommendations
    if (data.customerImpact.category === 'high' || data.customerImpact.category === 'severe') {
      recommendations.push('- Enhance passenger communication during disruptions');
      recommendations.push('- Review compensation and rebooking procedures');
    }

    return recommendations.length > 0 ? recommendations.join('\n') : '- Standard procedures followed effectively';
  }

  /**
   * Generate Executive Summary Report
   */
  static generateExecutiveSummary(data: MORData): string {
    const { flight, scenarioResult, costEstimate, customerImpact } = data;

    return `
EXECUTIVE SUMMARY - FLIGHT DIVERSION
====================================

Flight: ${flight.flightNumber} (${flight.origin} → ${flight.destination})
Diverted to: ${scenarioResult.diversionAirport}
Date: ${new Date().toLocaleDateString('en-GB')}

KEY METRICS
-----------
• Total Delay: ${scenarioResult.totalDelay} minutes
• Passengers Affected: Estimate based on delay duration
• Financial Impact: $${costEstimate.total.toLocaleString()}
• Customer Impact Score: ${customerImpact.score}/100 (${customerImpact.category.toUpperCase()})

DECISION RATIONALE
------------------
${scenarioResult.diversionReason}

OUTCOME
-------
${this.getOutcomeSummary(data)}

NEXT ACTIONS
------------
${this.getNextActions(data)}`;
  }

  private static getOutcomeSummary(data: MORData): string {
    const { scenarioResult, crewStatus } = data;
    
    if (scenarioResult.riskAssessment.overall === 'low') {
      return 'Diversion executed successfully with minimal operational impact. All safety margins maintained.';
    } else if (scenarioResult.riskAssessment.overall === 'medium') {
      return 'Diversion completed safely with manageable operational impact. Some recovery actions required.';
    } else {
      return 'Critical diversion executed under challenging conditions. Comprehensive review recommended.';
    }
  }

  private static getNextActions(data: MORData): string {
    const actions: string[] = [];
    
    if (data.costEstimate.total > 50000) {
      actions.push('• Financial review and insurance claim processing');
    }
    
    if (data.customerImpact.score > 50) {
      actions.push('• Customer service follow-up and compensation processing');
    }
    
    if (data.crewStatus.riskLevel !== 'low') {
      actions.push('• Crew scheduling review and potential duty time investigation');
    }
    
    actions.push('• Complete regulatory notifications within required timeframes');
    
    return actions.join('\n');
  }

  /**
   * Generate detailed operational analysis report
   */
  static generateOperationalAnalysis(data: MORData): {
    summary: string;
    detailedFinancial: any;
    riskAnalysis: any;
    recommendations: string[];
  } {
    const summary = this.generateExecutiveSummary(data);
    
    const detailedFinancial = {
      directCosts: data.costEstimate,
      indirectCosts: {
        brandImpact: data.customerImpact.score * 1000, // Estimated brand cost
        operationalRecovery: data.scenarioResult.operationalImpact.recoveryTime * 100,
        regulatoryCompliance: 5000 // Standard compliance costs
      },
      totalEstimatedImpact: data.costEstimate.total + (data.customerImpact.score * 1000) + 
                           (data.scenarioResult.operationalImpact.recoveryTime * 100) + 5000
    };

    const riskAnalysis = {
      primaryRisks: this.identifyPrimaryRisks(data),
      mitigationStrategies: this.identifyMitigationStrategies(data),
      futurePreventionMeasures: this.identifyPreventionMeasures(data)
    };

    const recommendations = this.generateDetailedRecommendations(data);

    return {
      summary,
      detailedFinancial,
      riskAnalysis,
      recommendations
    };
  }

  private static identifyPrimaryRisks(data: MORData): string[] {
    const risks: string[] = [];
    
    if (data.scenarioResult.riskAssessment.fuel !== 'low') {
      risks.push(`Fuel management risk: ${data.scenarioResult.riskAssessment.fuel} level`);
    }
    
    if (data.scenarioResult.riskAssessment.crew !== 'low') {
      risks.push(`Crew duty risk: ${data.scenarioResult.riskAssessment.crew} level`);
    }
    
    if (data.customerImpact.score > 60) {
      risks.push('High customer satisfaction risk');
    }
    
    return risks;
  }

  private static identifyMitigationStrategies(data: MORData): string[] {
    const strategies: string[] = [];
    
    strategies.push('Enhanced real-time monitoring systems');
    strategies.push('Improved decision support tools');
    strategies.push('Better crew resource management');
    strategies.push('Advanced weather prediction integration');
    
    return strategies;
  }

  private static identifyPreventionMeasures(data: MORData): string[] {
    const measures: string[] = [];
    
    measures.push('Predictive analytics for operational disruptions');
    measures.push('Enhanced crew scheduling algorithms');
    measures.push('Improved fuel planning with AI assistance');
    measures.push('Better passenger communication systems');
    
    return measures;
  }

  private static generateDetailedRecommendations(data: MORData): string[] {
    const recommendations: string[] = [];
    
    // Strategic recommendations
    recommendations.push('Implement predictive operational analytics');
    recommendations.push('Enhance real-time decision support capabilities');
    recommendations.push('Improve integrated communication systems');
    
    // Tactical recommendations
    if (data.fuelAnalysis.efficiency < 85) {
      recommendations.push('Review and optimize fuel planning procedures');
    }
    
    if (data.crewStatus.riskLevel !== 'low') {
      recommendations.push('Enhance crew resource and duty time management');
    }
    
    // Operational recommendations
    recommendations.push('Strengthen partnership agreements with diversion airports');
    recommendations.push('Enhance passenger care during disruptions');
    
    return recommendations;
  }

  /**
   * Generate JSON report for system integration
   */
  static generateJSONReport(data: MORData): string {
    const report = {
      metadata: {
        reportType: 'Flight Diversion Analysis',
        generatedAt: new Date().toISOString(),
        reportId: `RPT-${data.flight.flightNumber}-${Date.now()}`,
        version: '1.0'
      },
      flight: data.flight.printSummary(),
      diversion: data.scenarioResult,
      costs: data.costEstimate,
      customerImpact: data.customerImpact,
      crewStatus: data.crewStatus,
      fuelAnalysis: data.fuelAnalysis,
      analysis: this.generateOperationalAnalysis(data)
    };

    return JSON.stringify(report, null, 2);
  }
}