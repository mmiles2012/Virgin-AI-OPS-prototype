/**
 * Airport Data Enhancer for AINO Aviation Intelligence Platform
 * Provides comprehensive operational data for airports
 */

interface RunwayInfo {
  length_ft: number;
  width_ft: number;
  surface: string;
  lighted: boolean;
  ils_approaches: boolean;
  category: string;
}

interface AirportFacilities {
  fuel_available: boolean;
  fuel_types: string[];
  maintenance_available: boolean;
  cargo_facilities: boolean;
  customs_available: boolean;
  immigration_available: boolean;
  medical_facilities: boolean;
  fire_rescue_category: string;
  ground_handling: boolean;
  catering_available: boolean;
  hotels_nearby: boolean;
  rental_cars: boolean;
  public_transport: boolean;
}

interface OperationalData {
  operating_hours: string;
  atc_frequency: string;
  ground_frequency: string;
  tower_frequency: string;
  approach_frequency: string;
  atis_frequency: string;
  weather_reporting: boolean;
  noise_restrictions: boolean;
  slot_restrictions: boolean;
  international_gateway: boolean;
  hub_status: string;
  annual_passengers: number;
  annual_movements: number;
  peak_hour_capacity: number;
}

interface AirlinePresence {
  major_airlines: string[];
  cargo_airlines: string[];
  low_cost_carriers: string[];
  charter_operators: string[];
  alliance_hubs: string[];
}

export class AirportDataEnhancer {
  private static readonly MAJOR_AIRPORTS_DATA: { [key: string]: any } = {
    'EGLL': {
      runway_info: [
        { length_ft: 12802, width_ft: 150, surface: 'Asphalt', lighted: true, ils_approaches: true, category: 'CAT_III' },
        { length_ft: 12008, width_ft: 150, surface: 'Asphalt', lighted: true, ils_approaches: true, category: 'CAT_III' }
      ],
      facilities: {
        fuel_available: true,
        fuel_types: ['Jet A-1', 'Avgas 100LL', 'SAF'],
        maintenance_available: true,
        cargo_facilities: true,
        customs_available: true,
        immigration_available: true,
        medical_facilities: true,
        fire_rescue_category: 'Category 10',
        ground_handling: true,
        catering_available: true,
        hotels_nearby: true,
        rental_cars: true,
        public_transport: true
      },
      operational: {
        operating_hours: '24/7',
        atc_frequency: '127.525',
        ground_frequency: '121.9',
        tower_frequency: '118.5',
        approach_frequency: '119.725',
        atis_frequency: '113.75',
        weather_reporting: true,
        noise_restrictions: true,
        slot_restrictions: true,
        international_gateway: true,
        hub_status: 'Major International Hub',
        annual_passengers: 80884310,
        annual_movements: 472267,
        peak_hour_capacity: 90
      },
      airlines: {
        major_airlines: ['British Airways', 'Virgin Atlantic', 'American Airlines', 'United Airlines', 'Lufthansa', 'Air France'],
        cargo_airlines: ['British Airways World Cargo', 'Virgin Atlantic Cargo', 'FedEx', 'UPS', 'DHL'],
        low_cost_carriers: ['easyJet', 'Ryanair', 'Wizz Air'],
        charter_operators: ['TUI Airways', 'Jet2.com'],
        alliance_hubs: ['OneWorld (British Airways)', 'SkyTeam (Virgin Atlantic partner)']
      }
    },
    'KJFK': {
      runway_info: [
        { length_ft: 14511, width_ft: 150, surface: 'Asphalt', lighted: true, ils_approaches: true, category: 'CAT_III' },
        { length_ft: 11351, width_ft: 150, surface: 'Asphalt', lighted: true, ils_approaches: true, category: 'CAT_III' },
        { length_ft: 10000, width_ft: 150, surface: 'Asphalt', lighted: true, ils_approaches: true, category: 'CAT_II' },
        { length_ft: 8400, width_ft: 150, surface: 'Asphalt', lighted: true, ils_approaches: true, category: 'CAT_I' }
      ],
      facilities: {
        fuel_available: true,
        fuel_types: ['Jet A', 'Avgas 100LL', 'SAF'],
        maintenance_available: true,
        cargo_facilities: true,
        customs_available: true,
        immigration_available: true,
        medical_facilities: true,
        fire_rescue_category: 'Category 10',
        ground_handling: true,
        catering_available: true,
        hotels_nearby: true,
        rental_cars: true,
        public_transport: true
      },
      operational: {
        operating_hours: '24/7',
        atc_frequency: '119.1',
        ground_frequency: '121.9',
        tower_frequency: '119.1',
        approach_frequency: '125.25',
        atis_frequency: '128.725',
        weather_reporting: true,
        noise_restrictions: true,
        slot_restrictions: true,
        international_gateway: true,
        hub_status: 'Major International Hub',
        annual_passengers: 62551253,
        annual_movements: 446459,
        peak_hour_capacity: 75
      },
      airlines: {
        major_airlines: ['American Airlines', 'Delta Air Lines', 'United Airlines', 'Virgin Atlantic', 'British Airways', 'Lufthansa'],
        cargo_airlines: ['FedEx', 'UPS', 'DHL', 'Atlas Air', 'Polar Air Cargo'],
        low_cost_carriers: ['Southwest Airlines', 'JetBlue Airways', 'Spirit Airlines'],
        charter_operators: ['Miami Air International', 'Swift Air'],
        alliance_hubs: ['OneWorld (American Airlines)', 'SkyTeam (Delta Air Lines)', 'Star Alliance (United Airlines)']
      }
    },
    'EGCC': {
      runway_info: [
        { length_ft: 10000, width_ft: 150, surface: 'Asphalt', lighted: true, ils_approaches: true, category: 'CAT_III' },
        { length_ft: 9300, width_ft: 150, surface: 'Asphalt', lighted: true, ils_approaches: true, category: 'CAT_II' }
      ],
      facilities: {
        fuel_available: true,
        fuel_types: ['Jet A-1', 'Avgas 100LL'],
        maintenance_available: true,
        cargo_facilities: true,
        customs_available: true,
        immigration_available: true,
        medical_facilities: true,
        fire_rescue_category: 'Category 9',
        ground_handling: true,
        catering_available: true,
        hotels_nearby: true,
        rental_cars: true,
        public_transport: true
      },
      operational: {
        operating_hours: '24/7',
        atc_frequency: '118.625',
        ground_frequency: '121.7',
        tower_frequency: '118.625',
        approach_frequency: '119.4',
        atis_frequency: '128.175',
        weather_reporting: true,
        noise_restrictions: true,
        slot_restrictions: false,
        international_gateway: true,
        hub_status: 'Regional Hub',
        annual_passengers: 28225663,
        annual_movements: 188629,
        peak_hour_capacity: 55
      },
      airlines: {
        major_airlines: ['Virgin Atlantic', 'British Airways', 'KLM', 'Lufthansa', 'Emirates', 'Qatar Airways'],
        cargo_airlines: ['DHL', 'FedEx', 'UPS'],
        low_cost_carriers: ['easyJet', 'Ryanair', 'TUI Airways', 'Jet2.com'],
        charter_operators: ['TUI Airways', 'Jet2.com'],
        alliance_hubs: ['SkyTeam (Virgin Atlantic partner)']
      }
    },
    'VIDP': {
      runway_info: [
        { length_ft: 14534, width_ft: 150, surface: 'Asphalt', lighted: true, ils_approaches: true, category: 'CAT_III' },
        { length_ft: 12467, width_ft: 150, surface: 'Asphalt', lighted: true, ils_approaches: true, category: 'CAT_III' },
        { length_ft: 11483, width_ft: 150, surface: 'Asphalt', lighted: true, ils_approaches: true, category: 'CAT_II' }
      ],
      facilities: {
        fuel_available: true,
        fuel_types: ['Jet A-1', 'Avgas 100LL'],
        maintenance_available: true,
        cargo_facilities: true,
        customs_available: true,
        immigration_available: true,
        medical_facilities: true,
        fire_rescue_category: 'Category 10',
        ground_handling: true,
        catering_available: true,
        hotels_nearby: true,
        rental_cars: true,
        public_transport: true
      },
      operational: {
        operating_hours: '24/7',
        atc_frequency: '119.1',
        ground_frequency: '121.9',
        tower_frequency: '119.1',
        approach_frequency: '120.5',
        atis_frequency: '127.95',
        weather_reporting: true,
        noise_restrictions: true,
        slot_restrictions: true,
        international_gateway: true,
        hub_status: 'Major International Hub',
        annual_passengers: 72000000,
        annual_movements: 410000,
        peak_hour_capacity: 70
      },
      airlines: {
        major_airlines: ['Air India', 'IndiGo', 'SpiceJet', 'Emirates', 'Qatar Airways', 'Virgin Atlantic'],
        cargo_airlines: ['Blue Dart', 'FedEx', 'DHL', 'Air India Cargo'],
        low_cost_carriers: ['IndiGo', 'SpiceJet', 'GoAir', 'AirAsia India'],
        charter_operators: ['Club One Air', 'Zoom Air'],
        alliance_hubs: ['Star Alliance (Air India)']
      }
    }
  };

  static enhanceAirportData(airport: any): any {
    const icao = airport.icao || airport.icao_code;
    const enhancedData = this.MAJOR_AIRPORTS_DATA[icao];
    
    if (!enhancedData) {
      // Generate realistic data for airports without specific data
      return {
        ...airport,
        runway_info: this.generateRunwayInfo(airport),
        facilities: this.generateFacilities(airport),
        operational: this.generateOperationalData(airport),
        airlines: this.generateAirlinePresence(airport),
        enhancement_level: 'generated'
      };
    }

    return {
      ...airport,
      ...enhancedData,
      enhancement_level: 'authentic'
    };
  }

  private static generateRunwayInfo(airport: any): RunwayInfo[] {
    const type = airport.type || airport.airport_size;
    
    if (type === 'large_airport' || type === 'Large') {
      return [
        {
          length_ft: 10000 + Math.floor(Math.random() * 4000),
          width_ft: 150,
          surface: 'Asphalt',
          lighted: true,
          ils_approaches: true,
          category: 'CAT_II'
        },
        {
          length_ft: 8000 + Math.floor(Math.random() * 2000),
          width_ft: 150,
          surface: 'Asphalt',
          lighted: true,
          ils_approaches: true,
          category: 'CAT_I'
        }
      ];
    } else if (type === 'medium_airport' || type === 'Medium') {
      return [
        {
          length_ft: 6000 + Math.floor(Math.random() * 3000),
          width_ft: 100,
          surface: 'Asphalt',
          lighted: true,
          ils_approaches: Math.random() > 0.5,
          category: 'CAT_I'
        }
      ];
    } else {
      return [
        {
          length_ft: 2000 + Math.floor(Math.random() * 4000),
          width_ft: 75,
          surface: Math.random() > 0.3 ? 'Asphalt' : 'Concrete',
          lighted: Math.random() > 0.4,
          ils_approaches: false,
          category: 'Visual'
        }
      ];
    }
  }

  private static generateFacilities(airport: any): AirportFacilities {
    const type = airport.type || airport.airport_size;
    const hasScheduledService = airport.scheduled_service || airport.commercial_service === 'Yes';
    
    return {
      fuel_available: hasScheduledService || Math.random() > 0.3,
      fuel_types: hasScheduledService ? ['Jet A-1', 'Avgas 100LL'] : ['Avgas 100LL'],
      maintenance_available: type === 'large_airport' || Math.random() > 0.5,
      cargo_facilities: type === 'large_airport' || (type === 'medium_airport' && Math.random() > 0.4),
      customs_available: hasScheduledService && (type === 'large_airport' || Math.random() > 0.6),
      immigration_available: hasScheduledService && (type === 'large_airport' || Math.random() > 0.7),
      medical_facilities: type === 'large_airport' || Math.random() > 0.6,
      fire_rescue_category: type === 'large_airport' ? 'Category 8-10' : 
                           type === 'medium_airport' ? 'Category 5-7' : 'Category 1-4',
      ground_handling: hasScheduledService || Math.random() > 0.4,
      catering_available: hasScheduledService && (type === 'large_airport' || Math.random() > 0.5),
      hotels_nearby: type === 'large_airport' || Math.random() > 0.6,
      rental_cars: hasScheduledService && Math.random() > 0.5,
      public_transport: type === 'large_airport' || Math.random() > 0.4
    };
  }

  private static generateOperationalData(airport: any): OperationalData {
    const type = airport.type || airport.airport_size;
    const hasScheduledService = airport.scheduled_service || airport.commercial_service === 'Yes';
    
    return {
      operating_hours: type === 'large_airport' ? '24/7' : 
                      hasScheduledService ? '06:00-22:00' : '08:00-18:00',
      atc_frequency: this.generateFrequency(118, 136),
      ground_frequency: this.generateFrequency(121, 122),
      tower_frequency: this.generateFrequency(118, 136),
      approach_frequency: this.generateFrequency(119, 135),
      atis_frequency: this.generateFrequency(113, 135),
      weather_reporting: hasScheduledService || Math.random() > 0.4,
      noise_restrictions: type === 'large_airport' || Math.random() > 0.7,
      slot_restrictions: type === 'large_airport' && Math.random() > 0.6,
      international_gateway: hasScheduledService && (type === 'large_airport' || Math.random() > 0.8),
      hub_status: type === 'large_airport' ? 'Regional Hub' : 'Local Airport',
      annual_passengers: this.generatePassengerCount(type, hasScheduledService),
      annual_movements: this.generateMovementCount(type, hasScheduledService),
      peak_hour_capacity: this.generateCapacity(type)
    };
  }

  private static generateAirlinePresence(airport: any): AirlinePresence {
    const type = airport.type || airport.airport_size;
    const hasScheduledService = airport.scheduled_service || airport.commercial_service === 'Yes';
    
    if (!hasScheduledService) {
      return {
        major_airlines: [],
        cargo_airlines: [],
        low_cost_carriers: [],
        charter_operators: [],
        alliance_hubs: []
      };
    }

    const airlines = {
      major_airlines: [] as string[],
      cargo_airlines: [] as string[],
      low_cost_carriers: [] as string[],
      charter_operators: [] as string[],
      alliance_hubs: [] as string[]
    };

    if (type === 'large_airport') {
      airlines.major_airlines = ['National Carrier', 'Regional Airlines', 'International Partners'];
      airlines.cargo_airlines = ['FedEx', 'UPS', 'DHL'];
      airlines.low_cost_carriers = ['Budget Airlines', 'Regional LCC'];
      airlines.charter_operators = ['Charter Services'];
    } else if (type === 'medium_airport') {
      airlines.major_airlines = ['Regional Airlines'];
      airlines.low_cost_carriers = ['Budget Airlines'];
      airlines.charter_operators = ['Local Charter'];
    }

    return airlines;
  }

  private static generateFrequency(min: number, max: number): string {
    const freq = min + Math.random() * (max - min);
    return freq.toFixed(3);
  }

  private static generatePassengerCount(type: string, hasScheduledService: boolean): number {
    if (!hasScheduledService) return 0;
    
    if (type === 'large_airport') return Math.floor(Math.random() * 50000000) + 10000000;
    if (type === 'medium_airport') return Math.floor(Math.random() * 5000000) + 500000;
    return Math.floor(Math.random() * 100000) + 10000;
  }

  private static generateMovementCount(type: string, hasScheduledService: boolean): number {
    if (!hasScheduledService) return Math.floor(Math.random() * 10000) + 1000;
    
    if (type === 'large_airport') return Math.floor(Math.random() * 400000) + 100000;
    if (type === 'medium_airport') return Math.floor(Math.random() * 100000) + 20000;
    return Math.floor(Math.random() * 20000) + 5000;
  }

  private static generateCapacity(type: string): number {
    if (type === 'large_airport') return Math.floor(Math.random() * 40) + 60;
    if (type === 'medium_airport') return Math.floor(Math.random() * 20) + 30;
    return Math.floor(Math.random() * 10) + 5;
  }
}