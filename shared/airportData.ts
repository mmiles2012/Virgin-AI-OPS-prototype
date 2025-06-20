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
  },

  // Additional Major US Airports
  {
    icao: 'KATL',
    iata: 'ATL',
    name: 'Hartsfield-Jackson Atlanta International Airport',
    city: 'Atlanta',
    country: 'United States',
    latitude: 33.6407,
    longitude: -84.4277,
    elevation: 1026,
    timezone: 'America/New_York',
    runways: ['08L/26R', '08R/26L', '09L/27R', '09R/27L', '10/28'],
    category: 'major'
  },
  {
    icao: 'KDEN',
    iata: 'DEN',
    name: 'Denver International Airport',
    city: 'Denver',
    country: 'United States',
    latitude: 39.8561,
    longitude: -104.6737,
    elevation: 5431,
    timezone: 'America/Denver',
    runways: ['07/25', '08/26', '16L/34R', '16R/34L', '17L/35R', '17R/35L'],
    category: 'major'
  },
  {
    icao: 'KSEA',
    iata: 'SEA',
    name: 'Seattle-Tacoma International Airport',
    city: 'Seattle',
    country: 'United States',
    latitude: 47.4502,
    longitude: -122.3088,
    elevation: 131,
    timezone: 'America/Los_Angeles',
    runways: ['16L/34R', '16C/34C', '16R/34L'],
    category: 'major'
  },
  {
    icao: 'KSFO',
    iata: 'SFO',
    name: 'San Francisco International Airport',
    city: 'San Francisco',
    country: 'United States',
    latitude: 37.6213,
    longitude: -122.3790,
    elevation: 13,
    timezone: 'America/Los_Angeles',
    runways: ['01L/19R', '01R/19L', '10L/28R', '10R/28L'],
    category: 'major'
  },

  // Canada
  {
    icao: 'CYYZ',
    iata: 'YYZ',
    name: 'Toronto Pearson International Airport',
    city: 'Toronto',
    country: 'Canada',
    latitude: 43.6777,
    longitude: -79.6248,
    elevation: 569,
    timezone: 'America/Toronto',
    runways: ['05/23', '06L/24R', '06R/24L', '15L/33R', '15R/33L'],
    category: 'major'
  },
  {
    icao: 'CYVR',
    iata: 'YVR',
    name: 'Vancouver International Airport',
    city: 'Vancouver',
    country: 'Canada',
    latitude: 49.1939,
    longitude: -123.1844,
    elevation: 4,
    timezone: 'America/Vancouver',
    runways: ['08L/26R', '08R/26L', '12/30'],
    category: 'major'
  },

  // Additional European Airports
  {
    icao: 'LEMD',
    iata: 'MAD',
    name: 'Adolfo Suárez Madrid-Barajas Airport',
    city: 'Madrid',
    country: 'Spain',
    latitude: 40.4983,
    longitude: -3.5676,
    elevation: 2001,
    timezone: 'Europe/Madrid',
    runways: ['14L/32R', '14R/32L', '18L/36R', '18R/36L'],
    category: 'major'
  },
  {
    icao: 'LIRF',
    iata: 'FCO',
    name: 'Leonardo da Vinci Rome Fiumicino Airport',
    city: 'Rome',
    country: 'Italy',
    latitude: 41.8003,
    longitude: 12.2389,
    elevation: 13,
    timezone: 'Europe/Rome',
    runways: ['07/25', '16L/34R', '16C/34C', '16R/34L'],
    category: 'major'
  },
  {
    icao: 'LOWW',
    iata: 'VIE',
    name: 'Vienna International Airport',
    city: 'Vienna',
    country: 'Austria',
    latitude: 48.1103,
    longitude: 16.5697,
    elevation: 600,
    timezone: 'Europe/Vienna',
    runways: ['11/29', '16/34'],
    category: 'major'
  },
  {
    icao: 'ESSA',
    iata: 'ARN',
    name: 'Stockholm Arlanda Airport',
    city: 'Stockholm',
    country: 'Sweden',
    latitude: 59.6519,
    longitude: 17.9186,
    elevation: 137,
    timezone: 'Europe/Stockholm',
    runways: ['01L/19R', '01R/19L', '08/26'],
    category: 'major'
  },
  {
    icao: 'EKCH',
    iata: 'CPH',
    name: 'Copenhagen Airport',
    city: 'Copenhagen',
    country: 'Denmark',
    latitude: 55.6181,
    longitude: 12.6560,
    elevation: 17,
    timezone: 'Europe/Copenhagen',
    runways: ['04L/22R', '04R/22L', '12/30'],
    category: 'major'
  },

  // Middle East & Africa
  {
    icao: 'OMDB',
    iata: 'DXB',
    name: 'Dubai International Airport',
    city: 'Dubai',
    country: 'United Arab Emirates',
    latitude: 25.2532,
    longitude: 55.3657,
    elevation: 62,
    timezone: 'Asia/Dubai',
    runways: ['12L/30R', '12R/30L'],
    category: 'major'
  },
  {
    icao: 'OTHH',
    iata: 'DOH',
    name: 'Hamad International Airport',
    city: 'Doha',
    country: 'Qatar',
    latitude: 25.2731,
    longitude: 51.6080,
    elevation: 13,
    timezone: 'Asia/Qatar',
    runways: ['16L/34R', '16R/34L'],
    category: 'major'
  },
  {
    icao: 'FACT',
    iata: 'CPT',
    name: 'Cape Town International Airport',
    city: 'Cape Town',
    country: 'South Africa',
    latitude: -33.9648,
    longitude: 18.6017,
    elevation: 151,
    timezone: 'Africa/Johannesburg',
    runways: ['01/19', '16/34'],
    category: 'major'
  },
  {
    icao: 'FAOR',
    iata: 'JNB',
    name: 'O.R. Tambo International Airport',
    city: 'Johannesburg',
    country: 'South Africa',
    latitude: -26.1392,
    longitude: 28.2460,
    elevation: 5558,
    timezone: 'Africa/Johannesburg',
    runways: ['03L/21R', '03R/21L'],
    category: 'major'
  },

  // Additional Asia-Pacific
  {
    icao: 'ZBAA',
    iata: 'PEK',
    name: 'Beijing Capital International Airport',
    city: 'Beijing',
    country: 'China',
    latitude: 40.0801,
    longitude: 116.5846,
    elevation: 116,
    timezone: 'Asia/Shanghai',
    runways: ['01/19', '18L/36R', '18R/36L'],
    category: 'major'
  },
  {
    icao: 'ZSPD',
    iata: 'PVG',
    name: 'Shanghai Pudong International Airport',
    city: 'Shanghai',
    country: 'China',
    latitude: 31.1434,
    longitude: 121.8052,
    elevation: 13,
    timezone: 'Asia/Shanghai',
    runways: ['16L/34R', '16R/34L', '17L/35R', '17R/35L'],
    category: 'major'
  },
  {
    icao: 'VIDP',
    iata: 'DEL',
    name: 'Indira Gandhi International Airport',
    city: 'New Delhi',
    country: 'India',
    latitude: 28.5562,
    longitude: 77.1000,
    elevation: 777,
    timezone: 'Asia/Kolkata',
    runways: ['09/27', '10/28', '11/29'],
    category: 'major'
  },
  {
    icao: 'VOMM',
    iata: 'BOM',
    name: 'Chhatrapati Shivaji Maharaj International Airport',
    city: 'Mumbai',
    country: 'India',
    latitude: 19.0896,
    longitude: 72.8656,
    elevation: 39,
    timezone: 'Asia/Kolkata',
    runways: ['09/27', '14/32'],
    category: 'major'
  },
  {
    icao: 'RKSI',
    iata: 'ICN',
    name: 'Incheon International Airport',
    city: 'Seoul',
    country: 'South Korea',
    latitude: 37.4602,
    longitude: 126.4407,
    elevation: 23,
    timezone: 'Asia/Seoul',
    runways: ['15L/33R', '15R/33L', '16/34'],
    category: 'major'
  },
  {
    icao: 'YSSY',
    iata: 'SYD',
    name: 'Sydney Kingsford Smith Airport',
    city: 'Sydney',
    country: 'Australia',
    latitude: -33.9399,
    longitude: 151.1753,
    elevation: 21,
    timezone: 'Australia/Sydney',
    runways: ['07/25', '16L/34R', '16R/34L'],
    category: 'major'
  },
  {
    icao: 'YMML',
    iata: 'MEL',
    name: 'Melbourne Airport',
    city: 'Melbourne',
    country: 'Australia',
    latitude: -37.6690,
    longitude: 144.8410,
    elevation: 434,
    timezone: 'Australia/Melbourne',
    runways: ['09/27', '16/34'],
    category: 'major'
  },

  // South America
  {
    icao: 'SBGR',
    iata: 'GRU',
    name: 'São Paulo/Guarulhos International Airport',
    city: 'São Paulo',
    country: 'Brazil',
    latitude: -23.4356,
    longitude: -46.4731,
    elevation: 2461,
    timezone: 'America/Sao_Paulo',
    runways: ['09L/27R', '09R/27L'],
    category: 'major'
  },
  {
    icao: 'SAEZ',
    iata: 'EZE',
    name: 'Ministro Pistarini International Airport',
    city: 'Buenos Aires',
    country: 'Argentina',
    latitude: -34.8222,
    longitude: -58.5358,
    elevation: 67,
    timezone: 'America/Argentina/Buenos_Aires',
    runways: ['11/29', '17/35'],
    category: 'major'
  },

  // Additional Virgin Atlantic Routes
  {
    icao: 'KLAS',
    iata: 'LAS',
    name: 'Harry Reid International Airport',
    city: 'Las Vegas',
    country: 'United States',
    latitude: 36.0801,
    longitude: -115.1522,
    elevation: 2181,
    timezone: 'America/Los_Angeles',
    runways: ['01L/19R', '01R/19L', '07L/25R', '07R/25L'],
    category: 'major'
  },
  {
    icao: 'MMMX',
    iata: 'MEX',
    name: 'Mexico City International Airport',
    city: 'Mexico City',
    country: 'Mexico',
    latitude: 19.4363,
    longitude: -99.0721,
    elevation: 7316,
    timezone: 'America/Mexico_City',
    runways: ['05L/23R', '05R/23L'],
    category: 'major'
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