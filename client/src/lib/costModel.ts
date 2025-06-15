export interface DiversionCostEstimate {
  hotel: number;
  meals: number;
  rebooking: number;
  total: number;
  breakdown: {
    perPassenger: number;
    operationalOverhead: number;
    crewCosts: number;
    fuelCosts: number;
    handlingFees: number;
  };
}

export interface CustomerImpactScore {
  score: number; // 0-100
  factors: {
    delayMinutes: number;
    rerouteRequired: boolean;
    missedConnection: boolean;
    compensationRequired: boolean;
  };
  category: 'low' | 'moderate' | 'high' | 'severe';
  estimatedCompensation: number;
}

export class CostModel {
  private static readonly REGIONAL_RATES = {
    domestic: {
      hotelRate: 120,
      mealCost: 25,
      rebookingCost: 200,
      compensationRate: 250
    },
    european: {
      hotelRate: 180,
      mealCost: 35,
      rebookingCost: 300,
      compensationRate: 400
    },
    longhaul: {
      hotelRate: 250,
      mealCost: 50,
      rebookingCost: 500,
      compensationRate: 600
    }
  };

  /**
   * Estimate comprehensive diversion costs
   */
  static estimateDiversionCost(
    passengers: number,
    region: 'domestic' | 'european' | 'longhaul' = 'european',
    overnightRequired: boolean = false,
    delayHours: number = 0
  ): DiversionCostEstimate {
    const rates = this.REGIONAL_RATES[region];
    
    // Basic passenger costs
    const hotelTotal = overnightRequired ? passengers * rates.hotelRate : 0;
    const mealsTotal = passengers * rates.mealCost * Math.ceil(delayHours / 4); // Meal every 4 hours
    const rebookTotal = passengers * rates.rebookingCost;

    // Operational overhead (20% of passenger costs)
    const passengerSubtotal = hotelTotal + mealsTotal + rebookTotal;
    const operationalOverhead = passengerSubtotal * 0.20;

    // Crew costs
    const crewCosts = this.calculateCrewCosts(delayHours, overnightRequired, region);

    // Fuel costs (estimated additional fuel for diversion)
    const fuelCosts = this.estimateAdditionalFuelCosts(delayHours);

    // Handling fees at diversion airport
    const handlingFees = this.calculateHandlingFees(passengers, region);

    const total = passengerSubtotal + operationalOverhead + crewCosts + fuelCosts + handlingFees;

    return {
      hotel: hotelTotal,
      meals: mealsTotal,
      rebooking: rebookTotal,
      total: Math.round(total),
      breakdown: {
        perPassenger: Math.round(passengerSubtotal / passengers),
        operationalOverhead: Math.round(operationalOverhead),
        crewCosts: Math.round(crewCosts),
        fuelCosts: Math.round(fuelCosts),
        handlingFees: Math.round(handlingFees)
      }
    };
  }

  private static calculateCrewCosts(
    delayHours: number,
    overnightRequired: boolean,
    region: 'domestic' | 'european' | 'longhaul'
  ): number {
    const baseCrewSize = 12; // Typical wide-body crew
    let crewCost = 0;

    // Overtime costs
    if (delayHours > 2) {
      const overtimeHours = delayHours - 2;
      crewCost += baseCrewSize * overtimeHours * 50; // $50/hour overtime per crew member
    }

    // Accommodation costs
    if (overnightRequired) {
      const crewRates = {
        domestic: 100,
        european: 150,
        longhaul: 200
      };
      crewCost += baseCrewSize * crewRates[region];
    }

    // Positioning costs if crew replacement needed
    if (delayHours > 12) {
      crewCost += 8000; // Crew positioning cost
    }

    return crewCost;
  }

  private static estimateAdditionalFuelCosts(delayHours: number): number {
    // Additional fuel for diversion + holding + extra taxi time
    const additionalFuelKg = 1500 + (delayHours * 200); // Base + hourly burn
    const fuelPricePerKg = 0.85; // USD
    return additionalFuelKg * fuelPricePerKg;
  }

  private static calculateHandlingFees(
    passengers: number,
    region: 'domestic' | 'european' | 'longhaul'
  ): number {
    const baseFees = {
      domestic: 2000,
      european: 3500,
      longhaul: 5000
    };

    const perPassengerFee = passengers * 15; // $15 per passenger handling
    return baseFees[region] + perPassengerFee;
  }

  /**
   * Calculate customer disruption score
   */
  static customerDisruptionScore(
    delayMinutes: number,
    rerouteRequired: boolean = false,
    missedConnection: boolean = false
  ): CustomerImpactScore {
    let score = delayMinutes * 0.5;
    
    if (rerouteRequired) {
      score += 20;
    }
    
    if (missedConnection) {
      score += 30;
    }
    
    // Cap at 100
    score = Math.min(score, 100);

    // Determine category
    let category: 'low' | 'moderate' | 'high' | 'severe' = 'low';
    if (score >= 80) category = 'severe';
    else if (score >= 60) category = 'high';
    else if (score >= 30) category = 'moderate';

    // Calculate compensation (EU261 style)
    const compensationRequired = delayMinutes > 180;
    let estimatedCompensation = 0;
    
    if (compensationRequired) {
      if (delayMinutes > 240) {
        estimatedCompensation = 600; // Long haul, >4h delay
      } else {
        estimatedCompensation = 400; // Medium haul, 3-4h delay
      }
    }

    return {
      score: Math.round(score),
      factors: {
        delayMinutes,
        rerouteRequired,
        missedConnection,
        compensationRequired
      },
      category,
      estimatedCompensation
    };
  }

  /**
   * Calculate total operational impact cost
   */
  static calculateOperationalImpact(
    diversionCost: DiversionCostEstimate,
    downstreamFlights: number,
    slotLoss: boolean,
    aircraftUtilizationLoss: number // hours
  ): {
    diversionCost: number;
    downstreamImpact: number;
    slotLossCost: number;
    utilizationLoss: number;
    totalOperationalCost: number;
  } {
    // Downstream flight costs
    const avgFlightRevenue = 180000; // Average wide-body flight revenue
    const downstreamImpact = downstreamFlights * (avgFlightRevenue * 0.15); // 15% revenue impact

    // Slot loss cost (major airports)
    const slotLossCost = slotLoss ? 25000 : 0;

    // Aircraft utilization loss
    const hourlyUtilizationCost = 8500; // Cost per hour of aircraft downtime
    const utilizationLoss = aircraftUtilizationLoss * hourlyUtilizationCost;

    const totalOperationalCost = diversionCost.total + downstreamImpact + slotLossCost + utilizationLoss;

    return {
      diversionCost: diversionCost.total,
      downstreamImpact: Math.round(downstreamImpact),
      slotLossCost,
      utilizationLoss: Math.round(utilizationLoss),
      totalOperationalCost: Math.round(totalOperationalCost)
    };
  }

  /**
   * Generate cost-benefit analysis for different options
   */
  static generateCostBenefitAnalysis(
    options: Array<{
      name: string;
      cost: number;
      riskReduction: number; // 0-100
      timeToImplement: number; // minutes
      successProbability: number; // 0-1
    }>
  ) {
    return options.map(option => {
      // Calculate expected value
      const expectedValue = option.cost * option.successProbability;
      
      // Calculate risk-adjusted cost
      const riskAdjustment = (100 - option.riskReduction) / 100;
      const riskAdjustedCost = expectedValue * (1 + riskAdjustment);

      // Calculate time cost
      const timeCost = option.timeToImplement * 50; // $50 per minute of delay

      // Total weighted cost
      const totalWeightedCost = riskAdjustedCost + timeCost;

      return {
        ...option,
        expectedValue: Math.round(expectedValue),
        riskAdjustedCost: Math.round(riskAdjustedCost),
        timeCost,
        totalWeightedCost: Math.round(totalWeightedCost),
        costPerRiskReduction: option.riskReduction > 0 ? 
          Math.round(totalWeightedCost / option.riskReduction) : Infinity
      };
    }).sort((a, b) => a.totalWeightedCost - b.totalWeightedCost);
  }

  /**
   * Calculate insurance and liability costs
   */
  static calculateInsuranceLiability(
    scenario: 'medical' | 'technical' | 'weather',
    severity: 'minor' | 'major' | 'serious',
    passengers: number
  ): {
    liabilityCoverage: number;
    deductible: number;
    potentialClaims: number;
    estimatedPayout: number;
  } {
    const baseLiability = {
      medical: { minor: 50000, major: 200000, serious: 500000 },
      technical: { minor: 25000, major: 150000, serious: 750000 },
      weather: { minor: 10000, major: 75000, serious: 300000 }
    };

    const baseAmount = baseLiability[scenario][severity];
    const liabilityCoverage = baseAmount * passengers;
    
    // Deductible typically 5-10% of claim
    const deductible = liabilityCoverage * 0.075;

    // Estimate potential claims (percentage of passengers likely to claim)
    const claimRates = {
      minor: 0.1,   // 10% claim rate
      major: 0.3,   // 30% claim rate
      serious: 0.6  // 60% claim rate
    };

    const potentialClaims = Math.round(passengers * claimRates[severity]);
    const estimatedPayout = potentialClaims * (baseAmount * 0.7); // 70% average settlement

    return {
      liabilityCoverage: Math.round(liabilityCoverage),
      deductible: Math.round(deductible),
      potentialClaims,
      estimatedPayout: Math.round(estimatedPayout)
    };
  }
}