/**
 * Integrated Holding Pattern ML Service for AINO Aviation Platform
 * Combines Heathrow holding data with Network OTP ML and passenger connection predictions
 */

import heathrowHoldingService from './heathrowHoldingService.js';
import { PassengerConnectionService } from './passengerConnectionService.js';

class IntegratedHoldingMLService {
  constructor() {
    this.holdingService = heathrowHoldingService;
    this.connectionService = new PassengerConnectionService();
    this.predictionHistory = new Map();
    this.impactAnalysis = {
      networkOTP: new Map(),
      passengerConnections: new Map(),
      costImpacts: new Map()
    };
  }

  /**
   * Analyze how holding patterns impact network OTP performance
   */
  analyzeHoldingOTPImpact(holdingData, networkFlights) {
    const analysis = {
      timestamp: new Date().toISOString(),
      holding_impact: {
        total_aircraft_holding: holdingData.holding_status?.totalHolding || 0,
        stack_distribution: holdingData.holding_status?.stackCounts || {},
        estimated_delay_minutes: this.calculateHoldingDelayImpact(holdingData),
        affected_routes: this.identifyAffectedRoutes(holdingData, networkFlights)
      },
      otp_predictions: {
        baseline_otp: this.calculateBaselineOTP(networkFlights),
        holding_adjusted_otp: this.calculateHoldingAdjustedOTP(holdingData, networkFlights),
        degradation_percentage: 0,
        recovery_time_estimate: this.estimateRecoveryTime(holdingData)
      },
      ml_factors: {
        weather_correlation: this.analyzeWeatherCorrelation(holdingData),
        traffic_density: this.calculateTrafficDensity(holdingData),
        runway_utilization: this.estimateRunwayUtilization(holdingData),
        airspace_efficiency: this.calculateAirspaceEfficiency(holdingData)
      }
    };

    // Calculate OTP degradation
    analysis.otp_predictions.degradation_percentage = 
      ((analysis.otp_predictions.baseline_otp - analysis.otp_predictions.holding_adjusted_otp) / 
       analysis.otp_predictions.baseline_otp) * 100;

    this.impactAnalysis.networkOTP.set(Date.now(), analysis);
    return analysis;
  }

  /**
   * Analyze how holding patterns impact passenger connections
   */
  analyzeHoldingConnectionImpact(holdingData, passengers) {
    const connectionImpacts = [];
    const passengerData = this.connectionService.getAllPassengers();

    for (const passenger of passengerData) {
      for (const flight of passenger.connection_flights) {
        // Check if this flight is affected by holding patterns
        const holdingImpact = this.checkFlightHoldingImpact(flight.flight_number, holdingData);
        
        if (holdingImpact.isAffected) {
          const connectionRisk = this.assessConnectionRisk(passenger, flight, holdingImpact);
          
          connectionImpacts.push({
            passenger_id: passenger.passenger_id,
            passenger_name: passenger.name,
            flight_number: flight.flight_number,
            route: flight.route,
            holding_stack: holdingImpact.stack,
            estimated_delay: holdingImpact.estimatedDelay,
            connection_risk: connectionRisk.risk_level,
            risk_probability: connectionRisk.probability,
            mitigation_options: this.generateMitigationOptions(passenger, flight, holdingImpact),
            cost_impact: this.calculateConnectionCostImpact(passenger, holdingImpact)
          });
        }
      }
    }

    const analysis = {
      timestamp: new Date().toISOString(),
      total_affected_passengers: connectionImpacts.length,
      risk_distribution: this.categorizeConnectionRisks(connectionImpacts),
      total_estimated_cost: connectionImpacts.reduce((sum, impact) => sum + impact.cost_impact, 0),
      connection_impacts: connectionImpacts,
      recovery_recommendations: this.generateRecoveryRecommendations(connectionImpacts)
    };

    this.impactAnalysis.passengerConnections.set(Date.now(), analysis);
    return analysis;
  }

  /**
   * Calculate estimated delay impact from holding patterns
   */
  calculateHoldingDelayImpact(holdingData) {
    const totalHolding = holdingData.holding_status?.totalHolding || 0;
    const stackCounts = holdingData.holding_status?.stackCounts || {};
    
    // Each aircraft in holding typically adds 10-15 minutes to approach sequence
    const avgDelayPerAircraft = 12;
    const totalDelayMinutes = totalHolding * avgDelayPerAircraft;
    
    // Factor in stack distribution for more complex delay modeling
    const stackFactors = {
      'BNN': 1.0,  // Bovington - standard delay
      'BIG': 1.2,  // Biggin Hill - higher delay due to proximity to main approach
      'LAM': 1.1,  // Lambourne - moderate increase
      'OCK': 0.9   // Ockham - slightly lower delay
    };
    
    let weightedDelay = 0;
    for (const [stack, count] of Object.entries(stackCounts)) {
      const factor = stackFactors[stack] || 1.0;
      weightedDelay += count * avgDelayPerAircraft * factor;
    }
    
    return Math.round(weightedDelay);
  }

  /**
   * Identify routes affected by holding patterns
   */
  identifyAffectedRoutes(holdingData, networkFlights) {
    const affectedRoutes = [];
    const holdingFlights = holdingData.holding_analysis?.flights || [];
    
    // Find flights currently in holding
    const holdingFlightNumbers = holdingFlights
      .filter(f => f.holding && f.holding.isHolding)
      .map(f => f.flight_number);
    
    // Match with network flights to identify routes
    for (const flight of networkFlights) {
      if (holdingFlightNumbers.includes(flight.flight_number)) {
        affectedRoutes.push({
          flight_number: flight.flight_number,
          route: flight.route || `${flight.origin}-${flight.destination}`,
          aircraft_type: flight.aircraft_type,
          holding_stack: holdingFlights.find(f => f.flight_number === flight.flight_number)?.holding?.stack,
          estimated_delay: this.estimateFlightDelay(flight, holdingData)
        });
      }
    }
    
    return affectedRoutes;
  }

  /**
   * Calculate baseline OTP without holding impact
   */
  calculateBaselineOTP(networkFlights) {
    if (!networkFlights || networkFlights.length === 0) return 85.0;
    
    // Virgin Atlantic baseline OTP performance
    const onTimeFlights = networkFlights.filter(f => 
      !f.delay_minutes || f.delay_minutes <= 15
    ).length;
    
    return (onTimeFlights / networkFlights.length) * 100;
  }

  /**
   * Calculate OTP adjusted for holding patterns
   */
  calculateHoldingAdjustedOTP(holdingData, networkFlights) {
    const baseOTP = this.calculateBaselineOTP(networkFlights);
    const holdingImpact = this.calculateHoldingDelayImpact(holdingData);
    
    // Reduce OTP based on holding delay impact
    const otpReduction = Math.min(holdingImpact * 0.5, 25); // Max 25% reduction
    return Math.max(baseOTP - otpReduction, 60); // Minimum 60% OTP
  }

  /**
   * Estimate recovery time from holding patterns
   */
  estimateRecoveryTime(holdingData) {
    const totalHolding = holdingData.holding_status?.totalHolding || 0;
    
    if (totalHolding === 0) return 0;
    
    // Recovery time based on number of aircraft in holding
    // Assumes 2-3 minutes per aircraft to clear holding patterns
    const baseRecoveryMinutes = totalHolding * 2.5;
    
    // Add buffer for operational complexity
    const complexityFactor = Math.min(totalHolding / 10, 2); // Max 2x complexity
    
    return Math.round(baseRecoveryMinutes * (1 + complexityFactor));
  }

  /**
   * Check if a specific flight is impacted by holding patterns
   */
  checkFlightHoldingImpact(flightNumber, holdingData) {
    const holdingFlights = holdingData.holding_analysis?.flights || [];
    const flight = holdingFlights.find(f => f.flight_number === flightNumber);
    
    if (flight && flight.holding && flight.holding.isHolding) {
      return {
        isAffected: true,
        stack: flight.holding.stack,
        stackName: flight.holding.stackName,
        confidence: flight.holding.confidence,
        estimatedDelay: this.estimateFlightDelay(flight, holdingData)
      };
    }
    
    // Check if flight is likely to be affected by overall holding situation
    const totalHolding = holdingData.holding_status?.totalHolding || 0;
    if (totalHolding > 5) {
      return {
        isAffected: true,
        stack: 'SEQUENCE',
        stackName: 'Approach Sequence Delay',
        confidence: 0.6,
        estimatedDelay: Math.round(totalHolding * 2) // 2 minutes per holding aircraft
      };
    }
    
    return {
      isAffected: false,
      stack: null,
      stackName: null,
      confidence: 0,
      estimatedDelay: 0
    };
  }

  /**
   * Assess connection risk based on holding impact
   */
  assessConnectionRisk(passenger, flight, holdingImpact) {
    const baseConnectionTime = 90; // Assume 90-minute minimum connection time
    const delayImpact = holdingImpact.estimatedDelay;
    
    if (delayImpact >= 60) {
      return { risk_level: 'CRITICAL', probability: 0.9 };
    } else if (delayImpact >= 30) {
      return { risk_level: 'HIGH', probability: 0.7 };
    } else if (delayImpact >= 15) {
      return { risk_level: 'MEDIUM', probability: 0.5 };
    } else {
      return { risk_level: 'LOW', probability: 0.2 };
    }
  }

  /**
   * Generate mitigation options for affected connections
   */
  generateMitigationOptions(passenger, flight, holdingImpact) {
    const options = [];
    
    if (holdingImpact.estimatedDelay >= 30) {
      options.push({
        type: 'REBOOKING',
        description: 'Rebook on next available flight',
        estimated_cost: 150,
        probability_success: 0.8
      });
    }
    
    if (holdingImpact.estimatedDelay >= 15) {
      options.push({
        type: 'PRIORITY_HANDLING',
        description: 'Fast-track through connections',
        estimated_cost: 25,
        probability_success: 0.6
      });
    }
    
    options.push({
      type: 'PASSENGER_NOTIFICATION',
      description: 'Proactive passenger communication',
      estimated_cost: 5,
      probability_success: 0.9
    });
    
    return options;
  }

  /**
   * Calculate cost impact of connection disruption
   */
  calculateConnectionCostImpact(passenger, holdingImpact) {
    const baseCost = {
      rebooking: 150,
      accommodation: 200,
      meals: 50,
      compensation: 300,
      staff_time: 75
    };
    
    let totalCost = 0;
    
    if (holdingImpact.estimatedDelay >= 60) {
      // Critical delay - full service recovery
      totalCost = baseCost.rebooking + baseCost.accommodation + 
                  baseCost.meals + baseCost.compensation + baseCost.staff_time;
    } else if (holdingImpact.estimatedDelay >= 30) {
      // High delay - rebooking and support
      totalCost = baseCost.rebooking + baseCost.meals + baseCost.staff_time;
    } else if (holdingImpact.estimatedDelay >= 15) {
      // Medium delay - minimal support
      totalCost = baseCost.staff_time;
    }
    
    return totalCost;
  }

  /**
   * Generate comprehensive integrated analysis
   */
  async getIntegratedAnalysis(virginAtlanticFlights) {
    try {
      // Get current holding data
      const holdingData = await this.holdingService.getHoldingAnalysis(virginAtlanticFlights);
      
      // Get passenger data
      const passengers = this.connectionService.getAllPassengers();
      
      // Perform integrated analysis
      const otpImpact = this.analyzeHoldingOTPImpact(holdingData, virginAtlanticFlights);
      const connectionImpact = this.analyzeHoldingConnectionImpact(holdingData, passengers);
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        holding_data: holdingData,
        otp_impact_analysis: otpImpact,
        connection_impact_analysis: connectionImpact,
        integrated_recommendations: this.generateIntegratedRecommendations(otpImpact, connectionImpact),
        cost_summary: {
          network_otp_cost: this.calculateOTPCostImpact(otpImpact),
          passenger_connection_cost: connectionImpact.total_estimated_cost,
          total_estimated_cost: this.calculateOTPCostImpact(otpImpact) + connectionImpact.total_estimated_cost
        }
      };
    } catch (error) {
      console.error('Error generating integrated analysis:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Calculate OTP cost impact
   */
  calculateOTPCostImpact(otpImpact) {
    const degradation = otpImpact.otp_predictions.degradation_percentage;
    const affectedRoutes = otpImpact.holding_impact.affected_routes.length;
    
    // Cost per percentage point of OTP degradation
    const costPerPercent = 1000;
    const routeComplexityFactor = Math.min(affectedRoutes * 100, 1000);
    
    return Math.round(degradation * costPerPercent + routeComplexityFactor);
  }

  /**
   * Generate integrated recommendations
   */
  generateIntegratedRecommendations(otpImpact, connectionImpact) {
    const recommendations = [];
    
    // OTP-focused recommendations
    if (otpImpact.otp_predictions.degradation_percentage > 10) {
      recommendations.push({
        category: 'NETWORK_OTP',
        priority: 'HIGH',
        action: 'Implement holding pattern reduction strategy',
        description: 'Coordinate with ATC to expedite approach sequencing',
        estimated_benefit: `${Math.round(otpImpact.otp_predictions.degradation_percentage / 2)}% OTP improvement`,
        implementation_time: '15-30 minutes'
      });
    }
    
    // Connection-focused recommendations
    if (connectionImpact.total_affected_passengers > 0) {
      recommendations.push({
        category: 'PASSENGER_CONNECTIONS',
        priority: connectionImpact.total_affected_passengers > 5 ? 'HIGH' : 'MEDIUM',
        action: 'Activate connection protection protocol',
        description: 'Proactively manage at-risk passenger connections',
        estimated_benefit: `Protect ${connectionImpact.total_affected_passengers} passenger connections`,
        implementation_time: '5-10 minutes'
      });
    }
    
    // Cost optimization recommendations
    if (otpImpact.otp_predictions.degradation_percentage > 5 || connectionImpact.total_estimated_cost > 500) {
      recommendations.push({
        category: 'COST_OPTIMIZATION',
        priority: 'MEDIUM',
        action: 'Deploy predictive resource allocation',
        description: 'Allocate additional ground resources to minimize delay propagation',
        estimated_benefit: `Reduce costs by £${Math.round((otpImpact.otp_predictions.degradation_percentage * 100) + (connectionImpact.total_estimated_cost * 0.3))}`,
        implementation_time: '10-20 minutes'
      });
    }
    
    return recommendations;
  }

  // Helper methods for ML factor analysis
  analyzeWeatherCorrelation(holdingData) {
    // Simplified weather correlation - in production would integrate with weather API
    const totalHolding = holdingData.holding_status?.totalHolding || 0;
    return totalHolding > 3 ? 0.7 : 0.3; // High correlation if multiple aircraft holding
  }

  calculateTrafficDensity(holdingData) {
    const totalHolding = holdingData.holding_status?.totalHolding || 0;
    return Math.min(totalHolding / 10, 1.0); // Normalize to 0-1 scale
  }

  estimateRunwayUtilization(holdingData) {
    const totalHolding = holdingData.holding_status?.totalHolding || 0;
    return Math.min(0.6 + (totalHolding * 0.05), 0.95); // Base 60% + holding impact
  }

  calculateAirspaceEfficiency(holdingData) {
    const totalHolding = holdingData.holding_status?.totalHolding || 0;
    return Math.max(0.9 - (totalHolding * 0.05), 0.5); // Decreases with holding
  }

  estimateFlightDelay(flight, holdingData) {
    if (flight.holding && flight.holding.isHolding) {
      // Direct holding delay
      return 15 + Math.round(flight.holding.confidence * 20);
    }
    
    // Sequence delay based on total holding
    const totalHolding = holdingData.holding_status?.totalHolding || 0;
    return Math.round(totalHolding * 2);
  }

  categorizeConnectionRisks(connectionImpacts) {
    const distribution = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
    
    connectionImpacts.forEach(impact => {
      distribution[impact.connection_risk] = (distribution[impact.connection_risk] || 0) + 1;
    });
    
    return distribution;
  }

  generateRecoveryRecommendations(connectionImpacts) {
    const recommendations = [];
    
    const criticalCount = connectionImpacts.filter(i => i.connection_risk === 'CRITICAL').length;
    const highCount = connectionImpacts.filter(i => i.connection_risk === 'HIGH').length;
    
    if (criticalCount > 0) {
      recommendations.push({
        priority: 'IMMEDIATE',
        action: `Initiate emergency rebooking for ${criticalCount} critical connections`,
        timeline: '5 minutes'
      });
    }
    
    if (highCount > 0) {
      recommendations.push({
        priority: 'URGENT',
        action: `Activate fast-track processing for ${highCount} high-risk connections`,
        timeline: '10 minutes'
      });
    }
    
    return recommendations;
  }
}

// Create and export singleton instance
const integratedHoldingMLService = new IntegratedHoldingMLService();
export default integratedHoldingMLService;