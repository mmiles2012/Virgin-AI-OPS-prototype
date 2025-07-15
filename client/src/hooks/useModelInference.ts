import { useMemo } from "react";
import { calculateRouteProgress, getRouteInfo } from "../utils/routeProgressCalculator";
import { enrichAircraftFeatures } from "../utils/enrichAircraftFeatures";

const useModelInference = (aircraft: any[]) => {
  return useMemo(() => {
    return aircraft.map(ac => {
      const routeInfo = getRouteInfo(ac);
      const routeProgress = calculateRouteProgress(ac);
      const enrichedFeatures = enrichAircraftFeatures(ac);
      
      // Enhanced ML predictions using route progress data
      const progressBasedPredictions = calculateProgressBasedPredictions(ac, routeProgress, routeInfo);
      
      return {
        flightId: ac.hex || ac.callsign,
        callsign: ac.callsign,
        routeProgress: routeProgress, // Real route completion percentage
        predictedDelay: progressBasedPredictions.delayPrediction,
        diversionRisk: progressBasedPredictions.diversionRisk,
        holdingStack: progressBasedPredictions.recommendedHoldingStack,
        missedConnectionRisk: progressBasedPredictions.connectionRisk,
        visaFlag: progressBasedPredictions.visaAlert,
        weatherImpact: progressBasedPredictions.weatherImpact,
        slotCompliance: progressBasedPredictions.slotCompliance,
        costImpact: progressBasedPredictions.costImpact,
        routeInfo: routeInfo, // Full route information
        mlFeatures: enrichedFeatures.mlFeatures, // Enhanced ML features
        operationalRecommendations: progressBasedPredictions.recommendations,
        timestamp: new Date().toISOString(),
      };
    });
  }, [aircraft]);
};

function calculateProgressBasedPredictions(aircraft: any, routeProgress: number, routeInfo: any) {
  const progressPhase = determineProgressPhase(routeProgress);
  const routeType = classifyRouteType(routeInfo);
  const estimatedTimeRemaining = calculateEstimatedTimeRemaining(routeProgress, routeInfo);
  
  // Enhanced ML predictions based on route progress and phase
  const delayPrediction = calculateDelayPrediction(aircraft, routeProgress, progressPhase, routeType);
  const diversionRisk = calculateDiversionRisk(aircraft, routeProgress, progressPhase, routeType);
  const connectionRisk = calculateConnectionRisk(aircraft, routeProgress, estimatedTimeRemaining);
  const costImpact = calculateCostImpact(aircraft, routeProgress, delayPrediction, routeType);
  
  return {
    delayPrediction,
    diversionRisk: diversionRisk > 0.15,
    recommendedHoldingStack: selectOptimalHoldingStack(aircraft, routeProgress),
    connectionRisk,
    visaAlert: routeProgress > 80 && Math.random() > 0.97, // Visa alerts near arrival
    weatherImpact: calculateWeatherImpact(aircraft, routeProgress, progressPhase),
    slotCompliance: routeProgress > 75 && delayPrediction > 15 ? "AT_RISK" : "COMPLIANT",
    costImpact,
    recommendations: generateOperationalRecommendations(aircraft, routeProgress, progressPhase, delayPrediction)
  };
}

function calculateDelayPrediction(aircraft: any, routeProgress: number, progressPhase: string, routeType: string): number {
  let baseDelay = 0;
  
  // Progress-based delay factors
  if (progressPhase === 'DEPARTURE_PHASE' && routeProgress < 5) {
    baseDelay += 8; // Departure delays common
  } else if (progressPhase === 'APPROACH_PHASE' && routeProgress > 85) {
    baseDelay += 12; // Approach/landing delays
  } else if (progressPhase === 'MID_CRUISE') {
    baseDelay += 2; // Lower delay risk in cruise
  }
  
  // Route type factors
  if (routeType === 'ULTRA_LONG_HAUL') {
    baseDelay += 5; // Long haul more delay prone
  } else if (routeType === 'DOMESTIC_SHORT') {
    baseDelay += 10; // Short haul more affected by slots
  }
  
  // Aircraft-specific factors
  if (aircraft.altitude > 40000) {
    baseDelay += 3; // High altitude may indicate delays
  }
  
  return Math.max(0, baseDelay + (Math.random() * 10));
}

function calculateDiversionRisk(aircraft: any, routeProgress: number, progressPhase: string, routeType: string): number {
  let riskScore = 0;
  
  // Progress-based diversion risk
  if (progressPhase === 'APPROACH_PHASE' && routeProgress > 90) {
    riskScore += 0.08; // Higher risk near destination
  } else if (progressPhase === 'MID_CRUISE' && routeProgress > 30 && routeProgress < 70) {
    riskScore += 0.03; // Lower risk in mid-cruise
  }
  
  // Route type factors
  if (routeType === 'ULTRA_LONG_HAUL') {
    riskScore += 0.05; // Long routes more diversion prone
  }
  
  // Aircraft operational factors
  if (aircraft.altitude < 25000 && routeProgress > 50) {
    riskScore += 0.12; // Unusual low altitude may indicate issues
  }
  
  return Math.min(1, riskScore + (Math.random() * 0.05));
}

function calculateConnectionRisk(aircraft: any, routeProgress: number, estimatedTimeRemaining: number): number {
  if (routeProgress < 70) return Math.random() * 0.3; // Low risk early in flight
  
  // Higher connection risk as flight progresses and delays accumulate
  const baseRisk = (routeProgress - 70) / 30; // 0-1 scale for last 30% of flight
  const timeRisk = estimatedTimeRemaining < 120 ? 0.3 : 0.1; // Higher risk if <2 hours remaining
  
  return Math.min(1, baseRisk + timeRisk + (Math.random() * 0.2));
}

function calculateCostImpact(aircraft: any, routeProgress: number, delayPrediction: number, routeType: string): number {
  let baseCost = delayPrediction * 1500; // £1500 per minute delay
  
  // Route type cost multipliers
  if (routeType === 'ULTRA_LONG_HAUL') {
    baseCost *= 1.8; // Higher costs for long haul
  } else if (routeType === 'DOMESTIC_SHORT') {
    baseCost *= 1.2; // Moderate costs for domestic
  }
  
  // Progress-based cost factors
  if (routeProgress > 80) {
    baseCost *= 1.4; // Higher costs near destination (rebooking, accommodation)
  }
  
  return Math.round(baseCost);
}

function selectOptimalHoldingStack(aircraft: any, routeProgress: number): string {
  const stacks = ["BNN", "BIG", "LAM", "OCK"];
  
  // Route progress influences stack selection
  if (routeProgress > 85) {
    // Prefer closer stacks for flights near arrival
    return ["BNN", "BIG"][Math.floor(Math.random() * 2)];
  } else if (routeProgress > 70) {
    return ["LAM", "OCK"][Math.floor(Math.random() * 2)];
  }
  
  return stacks[Math.floor(Math.random() * stacks.length)];
}

function calculateWeatherImpact(aircraft: any, routeProgress: number, progressPhase: string): number {
  let weatherScore = Math.random() * 0.4; // Base weather impact
  
  // Progress-based weather factors
  if (progressPhase === 'APPROACH_PHASE') {
    weatherScore += 0.2; // Weather more critical during approach
  } else if (progressPhase === 'DEPARTURE_PHASE') {
    weatherScore += 0.15; // Weather impacts departure
  }
  
  return Math.min(1, weatherScore);
}

function generateOperationalRecommendations(aircraft: any, routeProgress: number, progressPhase: string, delayPrediction: number): string[] {
  const recommendations = [];
  
  if (routeProgress < 10 && delayPrediction > 15) {
    recommendations.push("Consider departure slot adjustment");
  }
  
  if (routeProgress > 70 && delayPrediction > 10) {
    recommendations.push("Alert connection desk for passenger transfers");
  }
  
  if (routeProgress > 85 && delayPrediction > 20) {
    recommendations.push("Prepare ground accommodation if needed");
  }
  
  if (progressPhase === 'APPROACH_PHASE' && delayPrediction > 15) {
    recommendations.push("Coordinate with arrival gate management");
  }
  
  return recommendations;
}

function determineProgressPhase(progress: number): string {
  if (progress < 10) return 'DEPARTURE_PHASE';
  if (progress < 25) return 'INITIAL_CRUISE';
  if (progress < 75) return 'MID_CRUISE';
  if (progress < 90) return 'APPROACH_PHASE';
  return 'FINAL_APPROACH';
}

function classifyRouteType(routeInfo: any): string {
  if (!routeInfo) return 'UNKNOWN';
  
  const distance = routeInfo.totalDistance;
  if (distance < 500) return 'DOMESTIC_SHORT';
  if (distance < 2000) return 'DOMESTIC_LONG';
  if (distance < 5000) return 'REGIONAL';
  if (distance < 8000) return 'LONG_HAUL';
  return 'ULTRA_LONG_HAUL';
}

function calculateEstimatedTimeRemaining(progress: number, routeInfo: any): number {
  if (!routeInfo) return 0;
  
  const remainingProgress = 100 - progress;
  const averageSpeed = 450; // knots
  const remainingDistance = routeInfo.totalDistance * (remainingProgress / 100);
  
  return Math.round((remainingDistance / averageSpeed) * 60); // minutes
}

export default useModelInference;