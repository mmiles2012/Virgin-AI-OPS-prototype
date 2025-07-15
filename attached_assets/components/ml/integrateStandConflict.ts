import { calculateStandConflict } from "../logic/calculateStandConflict";

export const factorStandConflictIntoDelayRisk = (
  delayScore: number,
  inboundFlight: any,
  scheduledFlights: any[]
) => {
  const conflict = calculateStandConflict(inboundFlight, scheduledFlights);
  if (conflict.conflict) {
    return delayScore + Math.min(conflict.waitTime / 5, 5); // bump score based on wait
  }
  return delayScore;
};