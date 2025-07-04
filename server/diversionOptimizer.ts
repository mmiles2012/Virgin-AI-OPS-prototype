/**
 * Advanced Diversion Optimizer for AINO Aviation Intelligence Platform
 * Integrates sophisticated flight operations calculations with real aviation physics
 * Based on professional flight operations utility with fuel, wind, and temperature modeling
 */

// Types for the diversion optimizer
export interface Aircraft {
  identifier: string;
  cruise_cas_kt: number;
  altitude_ft: number;
  fuel_flow_kg_per_hr: number;
  fuel_reserve_kg: number;
}

export interface Waypoint {
  name: string;
  lat: number;
  lon: number;
}

export interface MetSample {
  wind_dir_deg: number;
  wind_speed_kt: number;
  isa_dev_c: number;
}

export interface DiversionResult {
  alternate: Waypoint;
  distance_nm: number;
  ground_speed_kt: number;
  time_hr: number;
  fuel_required_kg: number;
  remaining_fuel_kg: number;
  reachable: boolean;
  notes: string;
}

// Aviation constants
const EARTH_RADIUS_NM = 3440.065;
const DEG2RAD = Math.PI / 180.0;
const RAD2DEG = 180.0 / Math.PI;

// Great circle distance calculation
export function haversineNm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const [rlat1, rlon1, rlat2, rlon2] = [lat1, lon1, lat2, lon2].map(x => x * DEG2RAD);
  const dlat = rlat2 - rlat1;
  const dlon = rlon2 - rlon1;
  const a = Math.sin(dlat / 2) ** 2 + Math.cos(rlat1) * Math.cos(rlat2) * Math.sin(dlon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_NM * c;
}

// Initial course calculation
export function initialCourseDeg(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const [rlat1, rlon1, rlat2, rlon2] = [lat1, lon1, lat2, lon2].map(x => x * DEG2RAD);
  const dlon = rlon2 - rlon1;
  const x = Math.sin(dlon) * Math.cos(rlat2);
  const y = Math.cos(rlat1) * Math.sin(rlat2) - Math.sin(rlat1) * Math.cos(rlat2) * Math.cos(dlon);
  const course = Math.atan2(x, y) * RAD2DEG;
  return (course + 360) % 360;
}

// Tailwind component calculation
export function tailwindComponent(windDirDeg: number, windSpeedKt: number, trackDeg: number): number {
  const relative = (windDirDeg - trackDeg + 180) * DEG2RAD;
  return windSpeedKt * Math.cos(relative);
}

// TAS correction for temperature
export function isaTasCorrectionCas(casKt: number, altitudeFt: number, isaDevC: number): number {
  return casKt * (1 + 0.02 * altitudeFt / 1000) * (1 + 0.02 * isaDevC / 15);
}

// Aircraft performance models for Virgin Atlantic fleet
export function getVirginAtlanticAircraftPerformance(aircraftType: string): Aircraft {
  const performances: Record<string, Aircraft> = {
    'Boeing 787-9': {
      identifier: 'B789',
      cruise_cas_kt: 485,
      altitude_ft: 41000,
      fuel_flow_kg_per_hr: 2800,
      fuel_reserve_kg: 5000
    },
    'Airbus A350-1000': {
      identifier: 'A35K',
      cruise_cas_kt: 490,
      altitude_ft: 41000,
      fuel_flow_kg_per_hr: 3100,
      fuel_reserve_kg: 6000
    },
    'Airbus A330-300': {
      identifier: 'A333',
      cruise_cas_kt: 470,
      altitude_ft: 37000,
      fuel_flow_kg_per_hr: 2400,
      fuel_reserve_kg: 4500
    },
    'Airbus A330-900': {
      identifier: 'A339',
      cruise_cas_kt: 475,
      altitude_ft: 38000,
      fuel_flow_kg_per_hr: 2600,
      fuel_reserve_kg: 4800
    }
  };

  return performances[aircraftType] || performances['Boeing 787-9'];
}

// Major European diversion airports for Virgin Atlantic operations
export function getEuropeanDiversionAirports(): Waypoint[] {
  return [
    { name: 'EGLL', lat: 51.4775, lon: -0.4614 },   // London Heathrow
    { name: 'EGKK', lat: 51.1481, lon: -0.1903 },   // London Gatwick  
    { name: 'EHAM', lat: 52.3086, lon: 4.7639 },    // Amsterdam
    { name: 'EDDF', lat: 50.0333, lon: 8.5706 },    // Frankfurt
    { name: 'LFPG', lat: 49.0128, lon: 2.5500 },    // Paris CDG
    { name: 'LEMD', lat: 40.4719, lon: -3.5626 },   // Madrid
    { name: 'LIRF', lat: 41.8003, lon: 12.2389 },   // Rome Fiumicino
    { name: 'LOWW', lat: 48.1103, lon: 16.5697 },   // Vienna
    { name: 'LSZH', lat: 47.4647, lon: 8.5492 },    // Zurich
    { name: 'ENGM', lat: 60.1939, lon: 11.1004 }    // Oslo
  ];
}

// North Atlantic diversion airports for transatlantic operations
export function getAtlanticDiversionAirports(): Waypoint[] {
  return [
    { name: 'BIKF', lat: 64.1300, lon: -21.9406 },  // Reykjavik
    { name: 'BGBW', lat: 61.3914, lon: -48.1231 },  // Nuuk
    { name: 'CYYR', lat: 53.3194, lon: -60.4267 },  // Goose Bay
    { name: 'CYFB', lat: 63.7567, lon: -68.5558 },  // Iqaluit
    { name: 'CYQX', lat: 48.9369, lon: -54.5681 },  // Gander
    { name: 'CYHZ', lat: 44.8808, lon: -63.5086 },  // Halifax
    { name: 'KBGR', lat: 44.8074, lon: -68.8281 },  // Bangor
    { name: 'KBOS', lat: 42.3656, lon: -71.0096 }   // Boston
  ];
}

// Simple weather model for demonstration
export class SimpleMet {
  constructor(
    private windDir: number = 270,
    private windSpeed: number = 30,
    private isaDeviation: number = 5
  ) {}

  getMetSample(lat: number, lon: number, altitudeFt: number): MetSample {
    // Add some realistic variation based on position
    const latVariation = Math.sin(lat * DEG2RAD) * 10;
    const lonVariation = Math.cos(lon * DEG2RAD) * 5;
    
    return {
      wind_dir_deg: (this.windDir + latVariation) % 360,
      wind_speed_kt: Math.max(5, this.windSpeed + lonVariation),
      isa_dev_c: this.isaDeviation + latVariation / 2
    };
  }
}

export class DiversionOptimizer {
  private aircraft: Aircraft;
  private metProvider: SimpleMet;

  constructor(aircraftType: string, windDir: number = 270, windSpeed: number = 30, isaDeviation: number = 5) {
    this.aircraft = getVirginAtlanticAircraftPerformance(aircraftType);
    this.metProvider = new SimpleMet(windDir, windSpeed, isaDeviation);
  }

  evaluateRoute(
    currentLat: number,
    currentLon: number,
    fuelRemainingKg: number,
    alternate: Waypoint
  ): DiversionResult {
    // Calculate distance and track
    const distanceNm = haversineNm(currentLat, currentLon, alternate.lat, alternate.lon);
    const trackDeg = initialCourseDeg(currentLat, currentLon, alternate.lat, alternate.lon);

    // Get weather at midpoint
    const midLat = (currentLat + alternate.lat) / 2;
    const midLon = (currentLon + alternate.lon) / 2;
    const met = this.metProvider.getMetSample(midLat, midLon, this.aircraft.altitude_ft);

    // Calculate aircraft performance
    const tas = isaTasCorrectionCas(this.aircraft.cruise_cas_kt, this.aircraft.altitude_ft, met.isa_dev_c);
    const tailwind = tailwindComponent(met.wind_dir_deg, met.wind_speed_kt, trackDeg);
    const groundSpeed = Math.max(tas + tailwind, 100); // Minimum 100kt ground speed

    // Calculate fuel requirements
    const timeHr = distanceNm / groundSpeed;
    const fuelRequired = timeHr * this.aircraft.fuel_flow_kg_per_hr + this.aircraft.fuel_reserve_kg;
    const remainingFuel = fuelRemainingKg - fuelRequired;
    const reachable = remainingFuel >= 0;

    return {
      alternate,
      distance_nm: Math.round(distanceNm * 10) / 10,
      ground_speed_kt: Math.round(groundSpeed * 10) / 10,
      time_hr: Math.round(timeHr * 100) / 100,
      fuel_required_kg: Math.round(fuelRequired * 10) / 10,
      remaining_fuel_kg: Math.round(remainingFuel * 10) / 10,
      reachable,
      notes: reachable ? "Reachable with adequate fuel" : "Insufficient fuel for diversion"
    };
  }

  findOptimalAlternate(
    currentLat: number,
    currentLon: number,
    fuelRemainingKg: number,
    alternates: Waypoint[]
  ): { best: DiversionResult; all: DiversionResult[] } {
    const results = alternates.map(alt => 
      this.evaluateRoute(currentLat, currentLon, fuelRemainingKg, alt)
    );

    const reachable = results.filter(r => r.reachable);
    
    let best: DiversionResult;
    if (reachable.length === 0) {
      // If none reachable, pick the one with highest fuel margin
      best = results.reduce((prev, curr) => 
        curr.remaining_fuel_kg > prev.remaining_fuel_kg ? curr : prev
      );
    } else {
      // Pick the reachable one requiring least fuel
      best = reachable.reduce((prev, curr) => 
        curr.fuel_required_kg < prev.fuel_required_kg ? curr : prev
      );
    }

    return { best, all: results };
  }
}

// Enhanced integration with AINO scenario analysis
export function enhancedDiversionAnalysis(
  aircraftType: string,
  currentLat: number,
  currentLon: number,
  fuelRemainingKg: number,
  route: string,
  windConditions?: { dir: number; speed: number; temp: number }
): {
  optimizer_results: { best: DiversionResult; all: DiversionResult[] };
  flight_physics: {
    wind_impact: string;
    fuel_efficiency: string;
    range_assessment: string;
  };
  operational_guidance: {
    primary_recommendation: string;
    backup_options: string[];
    crew_actions: string[];
  };
} {
  // Determine appropriate airport list based on route
  const alternates = route.includes('JFK') || route.includes('BOS') || route.includes('LAX') 
    ? getAtlanticDiversionAirports()
    : getEuropeanDiversionAirports();

  const weather = windConditions || { dir: 270, speed: 30, temp: 5 };
  const optimizer = new DiversionOptimizer(aircraftType, weather.dir, weather.speed, weather.temp);
  
  const results = optimizer.findOptimalAlternate(currentLat, currentLon, fuelRemainingKg, alternates);
  
  // Flight physics analysis
  const windImpact = weather.speed > 40 ? "High winds affecting fuel efficiency" : "Normal wind conditions";
  const fuelEfficiency = fuelRemainingKg > 15000 ? "Excellent fuel state" : "Fuel monitoring required";
  const rangeAssessment = results.all.filter(r => r.reachable).length > 5 ? "Multiple options available" : "Limited diversion options";

  // Operational guidance
  const primaryRecommendation = results.best.reachable 
    ? `Divert to ${results.best.alternate.name} - ${Math.round(results.best.distance_nm)}NM, ${results.best.time_hr}h flight time`
    : "Consider immediate fuel conservation measures";

  const backupOptions = results.all
    .filter(r => r.reachable && r.alternate.name !== results.best.alternate.name)
    .slice(0, 3)
    .map(r => `${r.alternate.name} (${Math.round(r.distance_nm)}NM)`);

  const crewActions = [
    "Initiate diversion checklist",
    "Contact ATC for routing clearance",
    "Brief cabin crew on situation",
    "Calculate fuel requirements",
    "Prepare for approach briefing"
  ];

  return {
    optimizer_results: results,
    flight_physics: {
      wind_impact: windImpact,
      fuel_efficiency: fuelEfficiency,
      range_assessment: rangeAssessment
    },
    operational_guidance: {
      primary_recommendation: primaryRecommendation,
      backup_options: backupOptions,
      crew_actions: crewActions
    }
  };
}