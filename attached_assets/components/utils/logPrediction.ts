export const logPredictions = (predictions: any[]) => {
  predictions.forEach(pred => {
    console.log(`[ML_LOG] Flight ${pred.flightId}:`, pred);
    // TODO: Replace with real database logging if desired
  });
};