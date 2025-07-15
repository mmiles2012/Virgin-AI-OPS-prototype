import { useMemo } from "react";

const useModelInference = (aircraft: any[]) => {
  return useMemo(() => {
    return aircraft.map(ac => ({
      flightId: ac.hex,
      predictedDelay: Math.random() * 30, // simulate 0–30 min
      diversionRisk: Math.random() > 0.9, // simulate 10% diversion flag
      holdingStack: ["BNN", "BIG", "LAM", "OCK"][Math.floor(Math.random() * 4)],
      missedConnectionRisk: Math.random(),
      visaFlag: Math.random() > 0.95,
      timestamp: new Date().toISOString(),
    }));
  }, [aircraft]);
};

export default useModelInference;