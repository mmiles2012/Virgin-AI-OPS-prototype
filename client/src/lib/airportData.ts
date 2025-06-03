export interface Airport {
  icao: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lon: number;
  elevation: number;
  runwayLength: number;
  medicalFacilities: boolean;
  fuelAvailable: boolean;
  maintenanceCapability: boolean;
  operatingHours: '24/7' | 'daylight' | 'restricted';
  emergencyServices: {
    fireRescue: boolean;
    medical: boolean;
    security: boolean;
  };
}

export const airports: Airport[] = [
  {
    icao: 'KJFK',
    iata: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'United States',
    lat: 40.6413,
    lon: -73.7781,
    elevation: 13,
    runwayLength: 14511,
    medicalFacilities: true,
    fuelAvailable: true,
    maintenanceCapability: true,
    operatingHours: '24/7',
    emergencyServices: {
      fireRescue: true,
      medical: true,
      security: true
    }
  },
  {
    icao: 'KLAX',
    iata: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    country: 'United States',
    lat: 33.9425,
    lon: -118.4081,
    elevation: 125,
    runwayLength: 12091,
    medicalFacilities: true,
    fuelAvailable: true,
    maintenanceCapability: true,
    operatingHours: '24/7',
    emergencyServices: {
      fireRescue: true,
      medical: true,
      security: true
    }
  },
  {
    icao: 'KORD',
    iata: 'ORD',
    name: "Chicago O'Hare International Airport",
    city: 'Chicago',
    country: 'United States',
    lat: 41.9742,
    lon: -87.9073,
    elevation: 672,
    runwayLength: 13000,
    medicalFacilities: true,
    fuelAvailable: true,
    maintenanceCapability: true,
    operatingHours: '24/7',
    emergencyServices: {
      fireRescue: true,
      medical: true,
      security: true
    }
  },
  {
    icao: 'KDEN',
    iata: 'DEN',
    name: 'Denver International Airport',
    city: 'Denver',
    country: 'United States',
    lat: 39.8561,
    lon: -104.6737,
    elevation: 5431,
    runwayLength: 16000,
    medicalFacilities: true,
    fuelAvailable: true,
    maintenanceCapability: true,
    operatingHours: '24/7',
    emergencyServices: {
      fireRescue: true,
      medical: true,
      security: true
    }
  },
  {
    icao: 'KATL',
    iata: 'ATL',
    name: 'Hartsfield-Jackson Atlanta International Airport',
    city: 'Atlanta',
    country: 'United States',
    lat: 33.6407,
    lon: -84.4277,
    elevation: 1026,
    runwayLength: 12390,
    medicalFacilities: true,
    fuelAvailable: true,
    maintenanceCapability: true,
    operatingHours: '24/7',
    emergencyServices: {
      fireRescue: true,
      medical: true,
      security: true
    }
  },
  {
    icao: 'KMIA',
    iata: 'MIA',
    name: 'Miami International Airport',
    city: 'Miami',
    country: 'United States',
    lat: 25.7959,
    lon: -80.2870,
    elevation: 9,
    runwayLength: 13016,
    medicalFacilities: true,
    fuelAvailable: true,
    maintenanceCapability: true,
    operatingHours: '24/7',
    emergencyServices: {
      fireRescue: true,
      medical: true,
      security: true
    }
  },
  {
    icao: 'KPHX',
    iata: 'PHX',
    name: 'Phoenix Sky Harbor International Airport',
    city: 'Phoenix',
    country: 'United States',
    lat: 33.4484,
    lon: -112.0740,
    elevation: 1135,
    runwayLength: 11489,
    medicalFacilities: true,
    fuelAvailable: true,
    maintenanceCapability: true,
    operatingHours: '24/7',
    emergencyServices: {
      fireRescue: true,
      medical: true,
      security: true
    }
  },
  {
    icao: 'KSEA',
    iata: 'SEA',
    name: 'Seattle-Tacoma International Airport',
    city: 'Seattle',
    country: 'United States',
    lat: 47.4502,
    lon: -122.3088,
    elevation: 131,
    runwayLength: 11901,
    medicalFacilities: true,
    fuelAvailable: true,
    maintenanceCapability: true,
    operatingHours: '24/7',
    emergencyServices: {
      fireRescue: true,
      medical: true,
      security: true
    }
  },
  {
    icao: 'KBOS',
    iata: 'BOS',
    name: 'Logan International Airport',
    city: 'Boston',
    country: 'United States',
    lat: 42.3656,
    lon: -71.0096,
    elevation: 20,
    runwayLength: 10083,
    medicalFacilities: true,
    fuelAvailable: true,
    maintenanceCapability: true,
    operatingHours: '24/7',
    emergencyServices: {
      fireRescue: true,
      medical: true,
      security: true
    }
  },
  {
    icao: 'KSFO',
    iata: 'SFO',
    name: 'San Francisco International Airport',
    city: 'San Francisco',
    country: 'United States',
    lat: 37.6213,
    lon: -122.3790,
    elevation: 14,
    runwayLength: 11870,
    medicalFacilities: true,
    fuelAvailable: true,
    maintenanceCapability: true,
    operatingHours: '24/7',
    emergencyServices: {
      fireRescue: true,
      medical: true,
      security: true
    }
  },
  {
    icao: 'KMSP',
    iata: 'MSP',
    name: 'Minneapolis-St. Paul International Airport',
    city: 'Minneapolis',
    country: 'United States',
    lat: 44.8848,
    lon: -93.2223,
    elevation: 841,
    runwayLength: 11000,
    medicalFacilities: true,
    fuelAvailable: true,
    maintenanceCapability: true,
    operatingHours: '24/7',
    emergencyServices: {
      fireRescue: true,
      medical: true,
      security: true
    }
  },
  {
    icao: 'KLAS',
    iata: 'LAS',
    name: 'McCarran International Airport',
    city: 'Las Vegas',
    country: 'United States',
    lat: 36.0840,
    lon: -115.1537,
    elevation: 2181,
    runwayLength: 14511,
    medicalFacilities: true,
    fuelAvailable: true,
    maintenanceCapability: true,
    operatingHours: '24/7',
    emergencyServices: {
      fireRescue: true,
      medical: true,
      security: true
    }
  }
];

// Utility functions for airport operations
export function findNearestAirports(
  currentLat: number, 
  currentLon: number, 
  count: number = 5
): Airport[] {
  return airports
    .map(airport => ({
      ...airport,
      distance: calculateDistance(currentLat, currentLon, airport.lat, airport.lon)
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, count);
}

export function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3440.065; // Earth's radius in nautical miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getAirportsByMedicalCapability(): Airport[] {
  return airports.filter(airport => airport.medicalFacilities);
}

export function getAirportsByRunwayLength(minLength: number): Airport[] {
  return airports.filter(airport => airport.runwayLength >= minLength);
}

export function canAccommodateBoeing787(airport: Airport): boolean {
  const minRunwayLength = 9000; // Boeing 787 minimum runway requirement
  return airport.runwayLength >= minRunwayLength && 
         airport.fuelAvailable && 
         airport.emergencyServices.fireRescue;
}
