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

// Indian subcontinent airports for flights to/from India (BOM, DEL, BLR, etc)
export function getIndianSubcontinentAirports(): Waypoint[] {
  return [
    { name: 'VABB', lat: 19.0896, lon: 72.8656 },   // Mumbai (Bombay)
    { name: 'VIDP', lat: 28.5665, lon: 77.1031 },   // Delhi
    { name: 'VOBL', lat: 13.1986, lon: 77.7066 },   // Bangalore
    { name: 'VOMM', lat: 13.0827, lon: 80.2707 },   // Chennai
    { name: 'VECC', lat: 22.6546, lon: 88.4467 },   // Kolkata
    { name: 'VOPB', lat: 11.1364, lon: 78.0066 },   // Puducherry
    { name: 'VOHS', lat: 17.2403, lon: 78.4294 },   // Hyderabad
    { name: 'VAJJ', lat: 26.8242, lon: 75.8120 },   // Jaipur
    { name: 'VAAH', lat: 23.0772, lon: 72.6347 },   // Ahmedabad
    { name: 'VEGY', lat: 15.3808, lon: 73.8314 }    // Goa
  ];
}

// Middle East airports for Europe-Asia routes
export function getMiddleEastAirports(): Waypoint[] {
  return [
    { name: 'OMDB', lat: 25.2532, lon: 55.3657 },   // Dubai
    { name: 'OOMS', lat: 23.5932, lon: 58.2844 },   // Muscat
    { name: 'OTBD', lat: 29.7040, lon: 50.9633 },   // Doha
    { name: 'OKBK', lat: 29.2267, lon: 47.9689 },   // Kuwait
    { name: 'OERK', lat: 24.9576, lon: 46.6988 },   // Riyadh
    { name: 'OEJN', lat: 21.6796, lon: 39.1565 },   // Jeddah
    { name: 'LTBA', lat: 40.9769, lon: 28.8146 },   // Istanbul
    { name: 'OIIE', lat: 35.4161, lon: 51.1522 }    // Tehran
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

// Get appropriate airports based on route and current position
export function getRouteAppropriateAirports(
  departureAirport: string,
  arrivalAirport: string,
  currentLat: number,
  currentLon: number
): Waypoint[] {
  // Define route regions for the entire Virgin Atlantic network
  const routeRegions: Record<string, string> = {
    // North America routes
    'LHR-JFK': 'north_atlantic',
    'LHR-BOS': 'north_atlantic', 
    'LHR-LAX': 'north_atlantic',
    'LHR-LAS': 'north_atlantic',
    'LHR-ORD': 'north_atlantic',
    'LHR-ATL': 'north_atlantic',
    'LHR-MIA': 'north_atlantic',
    'LHR-IAH': 'north_atlantic',
    'LHR-YVR': 'north_atlantic',
    'LHR-YUL': 'north_atlantic',
    'LHR-MCO': 'north_atlantic',
    'MAN-JFK': 'north_atlantic',
    'MAN-BOS': 'north_atlantic',
    'MAN-ORD': 'north_atlantic',
    'MAN-YVR': 'north_atlantic',
    'LGW-JFK': 'north_atlantic',
    'LGW-BOS': 'north_atlantic',
    'LGW-LAX': 'north_atlantic',
    'LGW-YVR': 'north_atlantic',
    
    // Asia routes
    'LHR-BOM': 'indian_subcontinent',
    'LHR-DEL': 'indian_subcontinent', 
    'LHR-BLR': 'indian_subcontinent',
    'LHR-HKG': 'asia_pacific',
    'LHR-NRT': 'asia_pacific',
    'LHR-ICN': 'asia_pacific',
    'LHR-SIN': 'asia_pacific',
    'LHR-DXB': 'middle_east',
    'LHR-DOH': 'middle_east',
    
    // Oceania routes
    'LHR-SYD': 'asia_pacific',
    'LHR-MEL': 'asia_pacific',
    'LHR-AKL': 'asia_pacific',
    
    // South America routes
    'LHR-GRU': 'south_america',
    'LHR-EZE': 'south_america',
    'LHR-GIG': 'south_america',
    
    // Africa routes
    'LHR-JNB': 'africa',
    'LHR-CPT': 'africa',
    'LHR-CAI': 'africa',
    'LHR-NBO': 'africa'
  };

  // Create route key
  const routeKey = `${departureAirport}-${arrivalAirport}`;
  const reverseRouteKey = `${arrivalAirport}-${departureAirport}`;
  
  // Determine region based on route
  const region = routeRegions[routeKey] || routeRegions[reverseRouteKey] || 'european';
  
  // Get airports based on region and current position
  let airports: Waypoint[] = [];
  
  switch (region) {
    case 'north_atlantic':
      // For North Atlantic routes, use position to determine east/west preference
      if (currentLon < -30) {
        // West side - prefer North American airports
        airports = [
          { name: 'KBOS', lat: 42.3656, lon: -71.0096 },   // Boston
          { name: 'KBGR', lat: 44.8074, lon: -68.8281 },   // Bangor
          { name: 'CYHZ', lat: 44.8808, lon: -63.5086 },   // Halifax
          { name: 'CYYR', lat: 53.3194, lon: -60.4267 },   // Goose Bay
          { name: 'CYQX', lat: 48.9369, lon: -54.5681 },   // Gander
          { name: 'KJFK', lat: 40.6413, lon: -73.7781 },   // JFK
          { name: 'KORD', lat: 41.9742, lon: -87.9073 }    // Chicago
        ];
      } else if (currentLon > -10) {
        // East side - prefer European airports
        airports = getEuropeanDiversionAirports();
      } else {
        // Mid-Atlantic - use oceanic airports
        airports = getAtlanticDiversionAirports();
      }
      break;
      
    case 'indian_subcontinent':
      // For India routes, use position to determine regional preference
      if (currentLon > 60) {
        // East of longitude 60 - prefer Indian airports
        airports = getIndianSubcontinentAirports();
      } else if (currentLon > 40) {
        // Middle East region
        airports = getMiddleEastAirports();
      } else {
        // Still in European airspace
        airports = getEuropeanDiversionAirports();
      }
      break;
      
    case 'asia_pacific':
      // For Asia-Pacific routes
      if (currentLon > 100) {
        // East Asia/Pacific
        airports = [
          { name: 'VHHH', lat: 25.2719, lon: 113.2644 },   // Hong Kong
          { name: 'RJAA', lat: 35.7647, lon: 140.3864 },   // Narita
          { name: 'RKSI', lat: 37.4602, lon: 126.4407 },   // Seoul
          { name: 'WSSS', lat: 1.3644, lon: 103.9915 },    // Singapore
          { name: 'YSSY', lat: -33.9399, lon: 151.1753 },  // Sydney
          { name: 'YMML', lat: -37.6690, lon: 144.8410 },  // Melbourne
          { name: 'NZAA', lat: -36.8485, lon: 174.7633 }   // Auckland
        ];
      } else if (currentLon > 50) {
        // Central Asia/Middle East
        airports = getMiddleEastAirports();
      } else {
        // European airspace
        airports = getEuropeanDiversionAirports();
      }
      break;
      
    case 'middle_east':
      airports = getMiddleEastAirports();
      break;
      
    case 'south_america':
      // For South America routes
      if (currentLat < -10) {
        // Southern hemisphere - prefer South American airports
        airports = [
          { name: 'SBGR', lat: -23.4356, lon: -46.4731 },   // São Paulo
          { name: 'SAEZ', lat: -34.8222, lon: -58.5358 },   // Buenos Aires
          { name: 'SBGL', lat: -22.8100, lon: -43.2506 },   // Rio de Janeiro
          { name: 'SCEL', lat: -33.3928, lon: -70.7858 },   // Santiago
          { name: 'SPJC', lat: -12.0219, lon: -77.1143 },   // Lima
          { name: 'SKBO', lat: 4.7016, lon: -74.1469 }      // Bogotá
        ];
      } else if (currentLat > 10) {
        // Northern hemisphere - prefer European airports
        airports = getEuropeanDiversionAirports();
      } else {
        // Equatorial region - prefer African airports
        airports = [
          { name: 'DIAP', lat: 36.6910, lon: 3.2154 },     // Algiers
          { name: 'GMMN', lat: 33.3675, lon: -7.5897 },    // Casablanca
          { name: 'LPPT', lat: 38.7813, lon: -9.1357 },    // Lisbon
          { name: 'GCFV', lat: 27.9318, lon: -15.3866 }    // Las Palmas
        ];
      }
      break;
      
    case 'africa':
      // For Africa routes
      if (currentLat < -20) {
        // Southern Africa
        airports = [
          { name: 'FAOR', lat: -26.1392, lon: 28.2460 },   // Johannesburg
          { name: 'FACT', lat: -33.9685, lon: 18.6017 },   // Cape Town
          { name: 'FYWH', lat: -17.9318, lon: 25.9238 },   // Victoria Falls
          { name: 'FQNP', lat: -29.9499, lon: 30.4006 }    // Pietermaritzburg
        ];
      } else if (currentLat > 20) {
        // North Africa
        airports = [
          { name: 'HECA', lat: 30.1219, lon: 31.4056 },    // Cairo
          { name: 'DIAP', lat: 36.6910, lon: 3.2154 },     // Algiers
          { name: 'GMMN', lat: 33.3675, lon: -7.5897 },    // Casablanca
          { name: 'OEJN', lat: 21.6796, lon: 39.1565 }     // Jeddah
        ];
      } else {
        // Equatorial Africa
        airports = [
          { name: 'HKJK', lat: -1.3192, lon: 36.9278 },    // Nairobi
          { name: 'HAAB', lat: 8.9780, lon: 38.7969 },     // Addis Ababa
          { name: 'FALA', lat: -8.8583, lon: 13.2312 },    // Luanda
          { name: 'FKKD', lat: -4.3917, lon: 15.4446 }     // Kinshasa
        ];
      }
      break;
      
    default:
      // European routes or fallback
      airports = getEuropeanDiversionAirports();
      break;
  }
  
  return airports;
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
  // Determine appropriate airport list based on route and current position
  let alternates: Waypoint[];
  
  if (route.includes('BOM') || route.includes('DEL') || route.includes('BLR') || route.includes('VABB') || route.includes('VIDP')) {
    // Routes to/from India - use Indian subcontinent airports
    alternates = getIndianSubcontinentAirports();
  } else if (route.includes('JFK') || route.includes('BOS') || route.includes('LAX') || route.includes('YYZ')) {
    // Transatlantic routes - use North Atlantic diversions
    alternates = getAtlanticDiversionAirports();
  } else if (currentLat > 20 && currentLon > 30 && currentLon < 80) {
    // Over Middle East/Asia corridor
    alternates = getMiddleEastAirports();
  } else {
    // European routes or default
    alternates = getEuropeanDiversionAirports();
  }

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