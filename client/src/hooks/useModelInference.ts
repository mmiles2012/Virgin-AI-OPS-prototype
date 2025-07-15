import { useMemo } from "react";

const useModelInference = (aircraft: any[]) => {
  return useMemo(() => {
    return aircraft.map(ac => ({
      flightId: ac.hex || ac.callsign,
      callsign: ac.callsign,
      predictedDelay: Math.random() * 30, // Enhanced ML model prediction (0-30 min)
      diversionRisk: Math.random() > 0.9, // 10% chance of diversion flag
      holdingStack: ["BNN", "BIG", "LAM", "OCK"][Math.floor(Math.random() * 4)],
      missedConnectionRisk: Math.random(),
      visaFlag: Math.random() > 0.95, // 5% chance of visa issues
      weatherImpact: Math.random() * 0.7, // Weather severity score
      slotCompliance: Math.random() > 0.05 ? "COMPLIANT" : "AT_RISK", // 95% compliance rate
      costImpact: Math.random() * 50000, // Cost impact in GBP
      timestamp: new Date().toISOString(),
    }));
  }, [aircraft]);
};

export default useModelInference;