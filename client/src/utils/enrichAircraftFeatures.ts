export const enrichAircraftFeatures = (ac: any) => {
  return {
    ...ac,
    distanceToDest: calculateDistance(ac.latitude || ac.lat, ac.longitude || ac.lon, ac.destLat || 51.4706, ac.destLon || -0.4619), // Default to LHR
    hourOfDay: new Date().getUTCHours(),
    weekday: new Date().getUTCDay(),
    altitudeBucket: Math.floor((ac.altitude || 0) / 1000),
    velocityBucket: Math.floor((ac.velocity || 0) / 50),
    headingBucket: Math.floor((ac.heading || 0) / 45),
    flightPhase: determineFlightPhase(ac),
    riskScore: calculateRiskScore(ac),
    mlFeatures: {
      temporal: {
        hour: new Date().getUTCHours(),
        day: new Date().getUTCDay(),
        month: new Date().getUTCMonth()
      },
      operational: {
        altitude: ac.altitude || 0,
        velocity: ac.velocity || 0,
        heading: ac.heading || 0
      },
      route: {
        origin: ac.departure_airport || ac.origin,
        destination: ac.arrival_airport || ac.destination,
        distance: calculateDistance(ac.latitude || ac.lat, ac.longitude || ac.lon, ac.destLat || 51.4706, ac.destLon || -0.4619)
      }
    }
  };
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
  
  const R = 6371; // km
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function determineFlightPhase(ac: any): string {
  const altitude = ac.altitude || 0;
  const velocity = ac.velocity || 0;
  
  if (altitude < 1000) return 'GROUND';
  if (altitude < 10000) return 'CLIMB';
  if (altitude > 30000 && velocity > 400) return 'CRUISE';
  if (altitude < 10000 && velocity < 300) return 'DESCENT';
  return 'UNKNOWN';
}

function calculateRiskScore(ac: any): number {
  const altitude = ac.altitude || 0;
  const velocity = ac.velocity || 0;
  
  let riskScore = 0;
  
  // Altitude risk
  if (altitude > 42000) riskScore += 0.3;
  if (altitude < 1000 && velocity > 200) riskScore += 0.4;
  
  // Velocity risk
  if (velocity > 500) riskScore += 0.2;
  if (velocity < 100 && altitude > 10000) riskScore += 0.3;
  
  // Weather risk (simulated)
  riskScore += Math.random() * 0.2;
  
  return Math.min(riskScore, 1.0);
}