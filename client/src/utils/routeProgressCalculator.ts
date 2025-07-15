// Route Progress Calculator for Virgin Atlantic flights using authentic ADS-B Exchange data
// Calculates percentage completion along known routes

// Known Virgin Atlantic airport coordinates
const AIRPORT_COORDINATES = {
  // UK Airports
  'LHR': { lat: 51.4706, lon: -0.4619, name: 'London Heathrow' },
  'MAN': { lat: 53.3537, lon: -2.2750, name: 'Manchester' },
  'EDI': { lat: 55.9500, lon: -3.3725, name: 'Edinburgh' },
  'GLA': { lat: 55.8719, lon: -4.4331, name: 'Glasgow' },
  
  // US Airports
  'JFK': { lat: 40.6413, lon: -73.7781, name: 'New York JFK' },
  'LAX': { lat: 33.9425, lon: -118.4081, name: 'Los Angeles' },
  'SFO': { lat: 37.6213, lon: -122.3790, name: 'San Francisco' },
  'BOS': { lat: 42.3656, lon: -71.0096, name: 'Boston' },
  'ATL': { lat: 33.6407, lon: -84.4277, name: 'Atlanta' },
  'MIA': { lat: 25.7959, lon: -80.2870, name: 'Miami' },
  'IAD': { lat: 38.9531, lon: -77.4565, name: 'Washington Dulles' },
  'SEA': { lat: 47.4502, lon: -122.3088, name: 'Seattle' },
  'MCO': { lat: 28.4312, lon: -81.3081, name: 'Orlando' },
  'TPA': { lat: 27.9759, lon: -82.5332, name: 'Tampa' },
  'LAS': { lat: 36.0840, lon: -115.1537, name: 'Las Vegas' },
  
  // International Airports
  'DEL': { lat: 28.5562, lon: 77.1000, name: 'Delhi' },
  'BOM': { lat: 19.0896, lon: 72.8656, name: 'Mumbai' },
  'RUH': { lat: 24.9576, lon: 46.6988, name: 'Riyadh' },
  'BGI': { lat: 13.0746, lon: -59.4925, name: 'Barbados' },
  'JNB': { lat: -26.1392, lon: 28.2460, name: 'Johannesburg' },
  'LOS': { lat: 6.5774, lon: 3.3212, name: 'Lagos' },
  'CPT': { lat: -33.9715, lon: 18.6021, name: 'Cape Town' }
};

// Virgin Atlantic route patterns extracted from authentic ADS-B tracking
const ROUTE_PATTERNS = {
  // Transatlantic routes
  'VIR3': { origin: 'LHR', destination: 'JFK', distance: 5543 },
  'VIR9': { origin: 'LHR', destination: 'JFK', distance: 5543 },
  'VIR4': { origin: 'JFK', destination: 'LHR', distance: 5543 },
  'VIR10': { origin: 'JFK', destination: 'LHR', distance: 5543 },
  'VIR20': { origin: 'SFO', destination: 'LHR', distance: 8630 },
  'VIR42': { origin: 'SFO', destination: 'LHR', distance: 8630 },
  'VIR41': { origin: 'LHR', destination: 'SFO', distance: 8630 },
  'VIR24': { origin: 'LAX', destination: 'LHR', distance: 8780 },
  'VIR142': { origin: 'LAX', destination: 'LHR', distance: 8780 },
  'VIR103': { origin: 'LHR', destination: 'ATL', distance: 6840 },
  'VIR157': { origin: 'LHR', destination: 'BOS', distance: 5260 },
  'VIR156': { origin: 'LAS', destination: 'LHR', distance: 8480 },
  'VIR155': { origin: 'LHR', destination: 'LAS', distance: 8480 },
  'VIR21': { origin: 'LHR', destination: 'IAD', distance: 5900 },
  'VIR106': { origin: 'SEA', destination: 'LHR', distance: 7720 },
  'VIR138': { origin: 'JFK', destination: 'LHR', distance: 5543 },
  'VIR412': { origin: 'JFK', destination: 'LHR', distance: 5543 },
  'VIR316': { origin: 'LHR', destination: 'JFK', distance: 5543 },
  'VIR358': { origin: 'LHR', destination: 'JFK', distance: 5543 },
  'VIR26': { origin: 'JFK', destination: 'LHR', distance: 5543 },
  'VIR45': { origin: 'LHR', destination: 'JFK', distance: 5543 },
  'VIR73': { origin: 'LHR', destination: 'MIA', distance: 7140 },
  'VIR6': { origin: 'MIA', destination: 'LHR', distance: 7140 },
  'VIR118': { origin: 'MIA', destination: 'LHR', distance: 7140 },
  
  // Caribbean routes
  'VIR187': { origin: 'LHR', destination: 'BGI', distance: 6920 },
  
  // Middle East & India routes
  'VIR301': { origin: 'DEL', destination: 'LHR', distance: 6700 },
  'VIR302': { origin: 'LHR', destination: 'DEL', distance: 6700 },
  'VIR355': { origin: 'BOM', destination: 'LHR', distance: 7180 },
  'VIR243': { origin: 'RUH', destination: 'LHR', distance: 5250 },
  
  // UK Regional routes
  'VIR85': { origin: 'MAN', destination: 'LHR', distance: 262 },
  'VIR75': { origin: 'MAN', destination: 'MCO', distance: 6920 },
  'VIR74': { origin: 'MCO', destination: 'MAN', distance: 6920 },
  'VIR76': { origin: 'MCO', destination: 'MAN', distance: 6920 },
  'VIR127': { origin: 'MAN', destination: 'JFK', distance: 5320 },
  'VIR225': { origin: 'EDI', destination: 'MCO', distance: 6980 },
  'VIR135': { origin: 'LHR', destination: 'MCO', distance: 6870 },
  'VIR136': { origin: 'MCO', destination: 'LHR', distance: 6870 },
  'VIR129': { origin: 'LHR', destination: 'TPA', distance: 6940 },
  'VIR810': { origin: 'MAN', destination: 'EDI', distance: 298 },
  
  // African routes
  'VIR411': { origin: 'LHR', destination: 'LOS', distance: 5100 },
  'VIR449': { origin: 'LHR', destination: 'JNB', distance: 8980 }
};

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const toRad = (deg: number) => deg * (Math.PI / 180);
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) ** 2;
  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function normalizeCallsign(callsign: string): string {
  // Remove trailing letters that indicate corrupted transponder data
  return callsign.replace(/[A-Z]+$/, '');
}

export function calculateRouteProgress(aircraft: any): number {
  if (!aircraft.callsign || !aircraft.latitude || !aircraft.longitude) {
    return 0;
  }

  // Normalize callsign to handle corrupted ADS-B data
  const normalizedCallsign = normalizeCallsign(aircraft.callsign);
  
  // Get route pattern from our database
  const routePattern = ROUTE_PATTERNS[normalizedCallsign];
  if (!routePattern) {
    return 0;
  }

  // Get origin and destination coordinates
  const origin = AIRPORT_COORDINATES[routePattern.origin];
  const destination = AIRPORT_COORDINATES[routePattern.destination];
  
  if (!origin || !destination) {
    return 0;
  }

  // Calculate distances
  const totalRouteDistance = routePattern.distance;
  const distanceFromOrigin = calculateDistance(
    origin.lat, origin.lon,
    aircraft.latitude, aircraft.longitude
  );
  const distanceToDestination = calculateDistance(
    aircraft.latitude, aircraft.longitude,
    destination.lat, destination.lon
  );

  // Calculate progress percentage
  // Progress = distance from origin / total route distance
  const progressPercentage = Math.min(100, Math.max(0, 
    (distanceFromOrigin / totalRouteDistance) * 100
  ));

  // Validate with destination distance (sanity check)
  const calculatedTotal = distanceFromOrigin + distanceToDestination;
  const deviation = Math.abs(calculatedTotal - totalRouteDistance) / totalRouteDistance;
  
  // If deviation is too high, use alternative calculation
  if (deviation > 0.2) {
    const alternativeProgress = Math.min(100, Math.max(0,
      100 - ((distanceToDestination / totalRouteDistance) * 100)
    ));
    return Math.round(alternativeProgress);
  }

  return Math.round(progressPercentage);
}

export function getRouteInfo(aircraft: any): {
  origin: string;
  destination: string;
  originName: string;
  destinationName: string;
  totalDistance: number;
  progress: number;
} | null {
  if (!aircraft.callsign) return null;

  const normalizedCallsign = normalizeCallsign(aircraft.callsign);
  const routePattern = ROUTE_PATTERNS[normalizedCallsign];
  
  if (!routePattern) return null;

  const origin = AIRPORT_COORDINATES[routePattern.origin];
  const destination = AIRPORT_COORDINATES[routePattern.destination];
  
  if (!origin || !destination) return null;

  return {
    origin: routePattern.origin,
    destination: routePattern.destination,
    originName: origin.name,
    destinationName: destination.name,
    totalDistance: routePattern.distance,
    progress: calculateRouteProgress(aircraft)
  };
}