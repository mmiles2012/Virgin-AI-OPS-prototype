export interface FuelDecisionAnalysis {
  requestedExtra: number; // kg
  actualBurn: number; // kg
  wastedFuel: number; // kg
  cost: number; // currency
  efficiency: number; // percentage
  recommendation: string;
}

export interface FuelOptimizationResult {
  currentBurn: number;
  optimizedBurn: number;
  potentialSavings: number;
  recommendations: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

export class FuelAnalytics {
  private static readonly COST_PER_KG = 0.82; // USD per kg (updated fuel price)
  private static readonly FUEL_DENSITY = 0.8; // kg/L for Jet A-1

  /**
   * Evaluate fuel decision efficiency
   */
  static evaluateFuelDecision(
    requestedExtra: number,
    actualBurn: number,
    costPerKg: number = this.COST_PER_KG
  ): FuelDecisionAnalysis {
    const wastedFuel = Math.max(0, requestedExtra - actualBurn);
    const cost = wastedFuel * costPerKg;
    const efficiency = actualBurn > 0 ? Math.min(100, (actualBurn / requestedExtra) * 100) : 0;

    let recommendation = '';
    if (efficiency >= 95) {
      recommendation = 'Excellent fuel planning - minimal waste';
    } else if (efficiency >= 85) {
      recommendation = 'Good fuel planning - minor optimization possible';
    } else if (efficiency >= 70) {
      recommendation = 'Moderate efficiency - review fuel planning procedures';
    } else {
      recommendation = 'Poor efficiency - significant fuel planning improvements needed';
    }

    return {
      requestedExtra,
      actualBurn,
      wastedFuel,
      cost: Math.round(cost * 100) / 100,
      efficiency: Math.round(efficiency * 10) / 10,
      recommendation
    };
  }

  /**
   * Calculate fuel requirements for different scenarios
   */
  static calculateScenarioFuel(
    baseDistance: number,
    aircraftType: string,
    weatherConditions: 'good' | 'moderate' | 'poor',
    altitudeRestrictions: boolean = false
  ): number {
    // Base fuel consumption rates (kg/km)
    const fuelRates = {
      'B787': 4.2,
      'A350': 4.0,
      'A330': 4.8,
      'B777': 5.5,
      'A340': 6.2
    };

    const baseRate = fuelRates[aircraftType as keyof typeof fuelRates] || 4.5;
    let totalFuel = baseDistance * baseRate;

    // Weather adjustments
    if (weatherConditions === 'moderate') {
      totalFuel *= 1.15; // 15% increase
    } else if (weatherConditions === 'poor') {
      totalFuel *= 1.35; // 35% increase
    }

    // Altitude restriction penalty
    if (altitudeRestrictions) {
      totalFuel *= 1.20; // 20% increase for suboptimal altitude
    }

    // Add regulatory reserves
    const contingencyFuel = totalFuel * 0.05; // 5% contingency
    const alternateFuel = totalFuel * 0.10; // 10% for alternate
    const finalReserveFuel = 1800; // 30 min holding fuel in kg

    return Math.round(totalFuel + contingencyFuel + alternateFuel + finalReserveFuel);
  }

  /**
   * Optimize fuel loading based on route and conditions
   */
  static optimizeFuelLoading(
    plannedFuel: number,
    routeDistance: number,
    aircraftType: string,
    weatherConditions: string,
    historicalData?: number[]
  ): FuelOptimizationResult {
    const recommendedFuel = this.calculateScenarioFuel(
      routeDistance,
      aircraftType,
      weatherConditions as 'good' | 'moderate' | 'poor'
    );

    const potentialSavings = Math.max(0, plannedFuel - recommendedFuel);
    const recommendations: string[] = [];

    // Generate recommendations based on analysis
    if (potentialSavings > 2000) {
      recommendations.push('Consider reducing fuel load by ' + Math.round(potentialSavings) + ' kg');
      recommendations.push('Review weather forecast for potential optimization');
    } else if (plannedFuel < recommendedFuel) {
      recommendations.push('Consider increasing fuel load for safety margin');
      recommendations.push('Current load may be insufficient for conditions');
    }

    // Historical analysis if available
    if (historicalData && historicalData.length > 0) {
      const avgHistorical = historicalData.reduce((a, b) => a + b, 0) / historicalData.length;
      if (plannedFuel > avgHistorical * 1.20) {
        recommendations.push('Fuel load significantly above historical average');
      }
    }

    // Risk assessment
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    const fuelMargin = (plannedFuel - recommendedFuel) / recommendedFuel;

    if (fuelMargin < -0.05) {
      riskLevel = 'critical';
      recommendations.push('CRITICAL: Fuel load below minimum safe requirements');
    } else if (fuelMargin < 0.05) {
      riskLevel = 'high';
      recommendations.push('HIGH RISK: Minimal fuel margin for contingencies');
    } else if (fuelMargin < 0.15) {
      riskLevel = 'medium';
    }

    return {
      currentBurn: plannedFuel,
      optimizedBurn: recommendedFuel,
      potentialSavings: Math.round(potentialSavings),
      recommendations,
      riskLevel
    };
  }

  /**
   * Calculate fuel cost analysis for operations
   */
  static calculateFuelCostAnalysis(
    dailyOperations: Array<{
      route: string;
      fuelUsed: number;
      fuelPlanned: number;
      distance: number;
    }>
  ) {
    let totalWaste = 0;
    let totalCost = 0;
    let totalSavingsOpportunity = 0;

    const routeAnalysis = dailyOperations.map(op => {
      const waste = Math.max(0, op.fuelPlanned - op.fuelUsed);
      const cost = waste * this.COST_PER_KG;
      const efficiency = op.fuelUsed > 0 ? (op.fuelUsed / op.fuelPlanned) * 100 : 0;

      totalWaste += waste;
      totalCost += cost;

      return {
        route: op.route,
        efficiency: Math.round(efficiency * 10) / 10,
        waste,
        cost: Math.round(cost),
        fuelPerKm: Math.round((op.fuelUsed / op.distance) * 100) / 100
      };
    });

    return {
      summary: {
        totalOperations: dailyOperations.length,
        totalWastedFuel: Math.round(totalWaste),
        totalWasteCost: Math.round(totalCost),
        averageEfficiency: Math.round(
          (routeAnalysis.reduce((sum, r) => sum + r.efficiency, 0) / routeAnalysis.length) * 10
        ) / 10
      },
      routeAnalysis,
      recommendations: this.generateFuelRecommendations(routeAnalysis)
    };
  }

  private static generateFuelRecommendations(
    routeAnalysis: Array<{
      route: string;
      efficiency: number;
      waste: number;
      cost: number;
      fuelPerKm: number;
    }>
  ): string[] {
    const recommendations: string[] = [];
    
    // Find routes with low efficiency
    const lowEfficiencyRoutes = routeAnalysis.filter(r => r.efficiency < 85);
    if (lowEfficiencyRoutes.length > 0) {
      recommendations.push(
        `Review fuel planning for routes: ${lowEfficiencyRoutes.map(r => r.route).join(', ')}`
      );
    }

    // Find routes with high waste
    const highWasteRoutes = routeAnalysis.filter(r => r.waste > 1000);
    if (highWasteRoutes.length > 0) {
      recommendations.push(
        `High fuel waste detected on: ${highWasteRoutes.map(r => r.route).join(', ')}`
      );
    }

    // General recommendations
    const avgEfficiency = routeAnalysis.reduce((sum, r) => sum + r.efficiency, 0) / routeAnalysis.length;
    if (avgEfficiency < 90) {
      recommendations.push('Consider implementing dynamic fuel planning based on real-time conditions');
      recommendations.push('Review historical fuel consumption patterns for optimization');
    }

    return recommendations;
  }

  /**
   * Real-time fuel monitoring during flight
   */
  static monitorFlightFuel(
    currentFuel: number,
    burnRate: number, // kg/hour
    remainingTime: number, // hours
    minimumRequired: number,
    alternateRequired: number = 0
  ) {
    const projectedFuelAtDestination = currentFuel - (burnRate * remainingTime);
    const totalRequired = minimumRequired + alternateRequired;
    const fuelMargin = projectedFuelAtDestination - totalRequired;

    let status: 'normal' | 'monitor' | 'caution' | 'critical' = 'normal';
    const alerts: string[] = [];

    if (fuelMargin < 1000) {
      status = 'critical';
      alerts.push('CRITICAL: Fuel state approaching minimum limits');
    } else if (fuelMargin < 2000) {
      status = 'caution';
      alerts.push('CAUTION: Monitor fuel consumption closely');
    } else if (fuelMargin < 3000) {
      status = 'monitor';
      alerts.push('Monitor fuel consumption');
    }

    return {
      currentFuel,
      projectedFuelAtDestination: Math.round(projectedFuelAtDestination),
      fuelMargin: Math.round(fuelMargin),
      status,
      alerts,
      recommendedAction: this.getFuelRecommendedAction(status, fuelMargin)
    };
  }

  private static getFuelRecommendedAction(
    status: string,
    fuelMargin: number
  ): string {
    switch (status) {
      case 'critical':
        return 'Consider immediate diversion to nearest suitable airport';
      case 'caution':
        return 'Request direct routing and monitor consumption closely';
      case 'monitor':
        return 'Continue monitoring - consider fuel-saving procedures';
      default:
        return 'Normal operations - no action required';
    }
  }
}