export interface Airport {
  icao: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  runways: string[];
  category: 'major' | 'international' | 'regional';
}

export const majorAirports: Airport[] = [
  // United Kingdom
  {
    icao: 'EGLL',
    iata: 'LHR',
    name: 'London Heathrow Airport',
    city: 'London',
    country: 'United Kingdom',
    latitude: 51.4706,
    longitude: -0.4619,
    elevation: 83,
    timezone: 'Europe/London',
    runways: ['09L/27R', '09R/27L'],
    category: 'major'
  },
  {
    icao: 'EGKK',
    iata: 'LGW',
    name: 'London Gatwick Airport',
    city: 'London',
    country: 'United Kingdom',
    latitude: 51.1481,
    longitude: -0.1903,
    elevation: 202,
    timezone: 'Europe/London',
    runways: ['07L/25R', '07R/25L'],
    category: 'major'
  },
  {
    icao: 'EGCC',
    iata: 'MAN',
    name: 'Manchester Airport',
    city: 'Manchester',
    country: 'United Kingdom',
    latitude: 53.3537,
    longitude: -2.2750,
    elevation: 256,
    timezone: 'Europe/London',
    runways: ['05L/23R', '05R/23L'],
    category: 'major'
  },

  // United States
  {
    icao: 'KJFK',
    iata: 'JFK',
    name: 'John F. Kennedy International Airport',
    city: 'New York',
    country: 'United States',
    latitude: 40.6413,
    longitude: -73.7781,
    elevation: 13,
    timezone: 'America/New_York',
    runways: ['04L/22R', '04R/22L', '08L/26R', '08R/26L'],
    category: 'major'
  },
  {
    icao: 'KLAX',
    iata: 'LAX',
    name: 'Los Angeles International Airport',
    city: 'Los Angeles',
    country: 'United States',
    latitude: 33.9425,
    longitude: -118.4081,
    elevation: 125,
    timezone: 'America/Los_Angeles',
    runways: ['06L/24R', '06R/24L', '07L/25R', '07R/25L'],
    category: 'major'
  },
  {
    icao: 'KORD',
    iata: 'ORD',
    name: "Chicago O'Hare International Airport",
    city: 'Chicago',
    country: 'United States',
    latitude: 41.9742,
    longitude: -87.9073,
    elevation: 672,
    timezone: 'America/Chicago',
    runways: ['04L/22R', '04R/22L', '09L/27R', '09R/27L', '10L/28R', '10R/28L', '14L/32R', '14R/32L'],
    category: 'major'
  },

  // Europe
  {
    icao: 'LFPG',
    iata: 'CDG',
    name: 'Charles de Gaulle Airport',
    city: 'Paris',
    country: 'France',
    latitude: 49.0097,
    longitude: 2.5479,
    elevation: 392,
    timezone: 'Europe/Paris',
    runways: ['08L/26R', '08R/26L', '09L/27R', '09R/27L'],
    category: 'major'
  },
  {
    icao: 'EDDF',
    iata: 'FRA',
    name: 'Frankfurt Airport',
    city: 'Frankfurt',
    country: 'Germany',
    latitude: 50.0264,
    longitude: 8.5431,
    elevation: 364,
    timezone: 'Europe/Berlin',
    runways: ['07L/25R', '07C/25C', '07R/25L', '18/36'],
    category: 'major'
  },
  {
    icao: 'EHAM',
    iata: 'AMS',
    name: 'Amsterdam Airport Schiphol',
    city: 'Amsterdam',
    country: 'Netherlands',
    latitude: 52.3086,
    longitude: 4.7639,
    elevation: -11,
    timezone: 'Europe/Amsterdam',
    runways: ['04/22', '06/24', '09/27', '18L/36R', '18C/36C', '18R/36L'],
    category: 'major'
  },

  // Asia-Pacific
  {
    icao: 'RJTT',
    iata: 'NRT',
    name: 'Narita International Airport',
    city: 'Tokyo',
    country: 'Japan',
    latitude: 35.7647,
    longitude: 140.3864,
    elevation: 141,
    timezone: 'Asia/Tokyo',
    runways: ['04/22', '16L/34R', '16R/34L'],
    category: 'major'
  },
  {
    icao: 'VHHH',
    iata: 'HKG',
    name: 'Hong Kong International Airport',
    city: 'Hong Kong',
    country: 'Hong Kong SAR',
    latitude: 22.3080,
    longitude: 113.9185,
    elevation: 28,
    timezone: 'Asia/Hong_Kong',
    runways: ['07L/25R', '07R/25L'],
    category: 'major'
  },
  {
    icao: 'WSSS',
    iata: 'SIN',
    name: 'Singapore Changi Airport',
    city: 'Singapore',
    country: 'Singapore',
    latitude: 1.3644,
    longitude: 103.9915,
    elevation: 22,
    timezone: 'Asia/Singapore',
    runways: ['02L/20R', '02C/20C', '02R/20L'],
    category: 'major'
  },

  // Virgin Atlantic Key Destinations
  {
    icao: 'KBOS',
    iata: 'BOS',
    name: 'Boston Logan International Airport',
    city: 'Boston',
    country: 'United States',
    latitude: 42.3656,
    longitude: -71.0096,
    elevation: 20,
    timezone: 'America/New_York',
    runways: ['04L/22R', '04R/22L', '09/27', '14/32', '15L/33R', '15R/33L'],
    category: 'major'
  },
  {
    icao: 'KMIA',
    iata: 'MIA',
    name: 'Miami International Airport',
    city: 'Miami',
    country: 'United States',
    latitude: 25.7932,
    longitude: -80.2906,
    elevation: 8,
    timezone: 'America/New_York',
    runways: ['08L/26R', '08R/26L', '09/27', '12/30'],
    category: 'major'
  },
  {
    icao: 'TBPB',
    iata: 'BGI',
    name: 'Grantley Adams International Airport',
    city: 'Bridgetown',
    country: 'Barbados',
    latitude: 13.0746,
    longitude: -59.4925,
    elevation: 169,
    timezone: 'America/Barbados',
    runways: ['09/27'],
    category: 'international'
  }
];

export const getAirportByICAO = (icao: string): Airport | undefined => {
  return majorAirports.find(airport => airport.icao === icao);
};

export const getAirportByIATA = (iata: string): Airport | undefined => {
  return majorAirports.find(airport => airport.iata === iata);
};

export const getAirportsInBounds = (bounds: {
  north: number;
  south: number;
  east: number;
  west: number;
}): Airport[] => {
  return majorAirports.filter(airport => 
    airport.latitude >= bounds.south &&
    airport.latitude <= bounds.north &&
    airport.longitude >= bounds.west &&
    airport.longitude <= bounds.east
  );
};