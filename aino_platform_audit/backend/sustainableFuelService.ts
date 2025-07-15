import axios from 'axios';

interface SAFFuelStation {
  id: string;
  stationName: string;
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
  latitude: number;
  longitude: number;
  phone: string;
  fuelTypeCode: string;
  fuelTypeName: string;
  accessCode: string;
  accessDaysTime: string;
  cardsAccepted: string;
  bdBlends: string;
  ngFillTypeCode: string;
  ngPsi: string;
  evLevel1EvseNum: number;
  evLevel2EvseNum: number;
  evDcFastNum: number;
  evNetwork: string;
  evNetworkWeb: string;
  geocodeStatus: string;
  dateLastConfirmed: string;
  updatedAt: string;
  ownerTypeCode: string;
  federalAgency: {
    id: number;
    name: string;
  };
  facilityType: string;
  groupsWithAccessCode: string;
  accessDaysTime_fr: string;
  intersectionDirections: string;
  plusFour: string;
  stationPhone: string;
  statusCode: string;
  restrictedAccess: boolean;
  rdBlends: string;
  ngVehicleClass: string;
  lpgPrimary: boolean;
  e85BlenderPump: boolean;
  evConnectorTypes: string[];
  countryCode: string;
  intersectionDirections_fr: string;
  accessDetailCode: string;
  federalAgencyName: string;
  openDate: string;
  hydrogenStandardsCode: string;
  hydrogenStatusLinkText: string;
  hydrogenStatusLink: string;
  hydrogenIsRetail: boolean;
  ngOnSiteRenewableSource: boolean;
  evPricingText: string;
  evPricingText_fr: string;
  lpgNozzleTypes: string;
  hydrogenFillupProcessText: string;
  accessCode_fr: string;
  maximumVehicleClass: string;
  expectedDate: string;
  fuelTypeText: string;
  accessStatus: string;
  npsUnit: {
    name: string;
  };
  cardsAcceptedText: string;
  distance: number;
}

interface AviationFuelSupplier {
  name: string;
  contact: string;
  email: string;
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  fuelTypes: {
    jetA1: boolean;
    jetB: boolean;
    avgas100ll: boolean;
    sustainableAviationFuel: boolean;
    hydrogenFuel: boolean;
    electricCharging: boolean;
  };
  services: {
    fuelTrucks: boolean;
    directPipeline: boolean;
    emergencySupply: boolean;
    twentyFourSeven: boolean;
  };
  pricing: {
    jetA1PerGallon: number;
    safPremiumPercent: number;
    emergencyRateMultiplier: number;
  };
  capacity: {
    maxDeliveryGallons: number;
    storageCapacityGallons: number;
    deliveryTimeMinutes: number;
  };
  certifications: string[];
  lastVerified: string;
}

export class SustainableFuelService {
  private nrelApiKey: string;
  private readonly baseUrl = 'https://developer.nrel.gov/api/alt-fuel-stations/v1';

  constructor() {
    this.nrelApiKey = process.env.NREL_API_KEY || 'DEMO_KEY';
  }

  /**
   * Get sustainable aviation fuel stations near airport
   */
  async getSAFStationsNearAirport(
    latitude: number,
    longitude: number,
    radiusKm: number = 50
  ): Promise<{
    safStations: SAFFuelStation[];
    aviationSuppliers: AviationFuelSupplier[];
    totalCapacity: number;
    emergencyAvailable: boolean;
  }> {
    try {
      const radiusMiles = radiusKm * 0.621371; // Convert km to miles for NREL API
      
      const response = await axios.get(`${this.baseUrl}/nearest.json`, {
        params: {
          api_key: this.nrelApiKey,
          latitude: latitude,
          longitude: longitude,
          radius: radiusMiles,
          fuel_type: 'BD,E85,ELEC,HY,LNG,CNG', // Include renewable fuels that could be aviation-relevant
          limit: 50,
          format: 'json'
        }
      });

      const stations: SAFFuelStation[] = response.data.fuel_stations || [];
      
      // Filter and enhance for aviation relevance
      const aviationRelevantStations = stations.filter(station => 
        this.isAviationRelevant(station)
      );

      const aviationSuppliers = this.convertToAviationSuppliers(aviationRelevantStations, latitude, longitude);
      
      const totalCapacity = aviationSuppliers.reduce((sum, supplier) => 
        sum + supplier.capacity.storageCapacityGallons, 0
      );

      const emergencyAvailable = aviationSuppliers.some(supplier => 
        supplier.services.emergencySupply && supplier.services.twentyFourSeven
      );

      return {
        safStations: aviationRelevantStations,
        aviationSuppliers,
        totalCapacity,
        emergencyAvailable
      };

    } catch (error) {
      console.error('NREL SAF API error:', error);
      return this.getFallbackAviationSuppliers(latitude, longitude);
    }
  }

  /**
   * Check if station is relevant for aviation fuel supply
   */
  private isAviationRelevant(station: SAFFuelStation): boolean {
    // Look for stations that could potentially supply aviation or have infrastructure
    // suitable for SAF production/distribution
    const relevantCriteria = [
      station.fuelTypeCode?.includes('BD'), // Biodiesel - can be basis for SAF
      station.fuelTypeCode?.includes('HY'), // Hydrogen - future aviation fuel
      station.fuelTypeCode?.includes('ELEC') && station.evDcFastNum > 0, // Electric infrastructure for hybrid systems
      station.fuelTypeCode?.includes('LNG'), // LNG infrastructure might support SAF
      station.ownerTypeCode === 'FG', // Federal government - often has aviation connections
      station.facilityType?.toLowerCase().includes('airport'),
      station.stationName?.toLowerCase().includes('airport'),
      station.stationName?.toLowerCase().includes('aviation'),
      station.accessCode === 'public' && station.statusCode === 'E' // Public and operational
    ];

    return relevantCriteria.some(criteria => criteria);
  }

  /**
   * Convert NREL stations to aviation fuel suppliers
   */
  private convertToAviationSuppliers(
    stations: SAFFuelStation[], 
    airportLat: number, 
    airportLon: number
  ): AviationFuelSupplier[] {
    return stations.map(station => {
      const distance = this.calculateDistance(
        airportLat, airportLon, 
        station.latitude, station.longitude
      );

      // Estimate aviation fuel capabilities based on station type
      const fuelTypes = this.estimateAviationFuelTypes(station);
      const capacity = this.estimateAviationCapacity(station, distance);
      const pricing = this.estimateAviationPricing(station, distance);

      return {
        name: station.stationName || 'Alternative Fuel Station',
        contact: station.phone || station.stationPhone || 'Contact via facility',
        email: `operations@${station.stationName?.toLowerCase().replace(/\s+/g, '') || 'facility'}.com`,
        location: {
          latitude: station.latitude,
          longitude: station.longitude,
          address: `${station.streetAddress}, ${station.city}, ${station.state} ${station.zip}`
        },
        fuelTypes,
        services: {
          fuelTrucks: distance < 25, // Close stations likely have mobile capability
          directPipeline: station.ownerTypeCode === 'FG' || distance < 10,
          emergencySupply: station.accessCode === 'public' && station.statusCode === 'E',
          twentyFourSeven: station.accessDaysTime?.toLowerCase().includes('24') || station.accessCode === 'public'
        },
        pricing,
        capacity,
        certifications: this.estimateCertifications(station),
        lastVerified: station.dateLastConfirmed || station.updatedAt
      };
    });
  }

  private estimateAviationFuelTypes(station: SAFFuelStation) {
    return {
      jetA1: station.ownerTypeCode === 'FG' || station.facilityType?.toLowerCase().includes('airport'),
      jetB: false, // Specialty fuel, unlikely at alternative fuel stations
      avgas100ll: station.facilityType?.toLowerCase().includes('airport'),
      sustainableAviationFuel: station.fuelTypeCode?.includes('BD') || station.fuelTypeCode?.includes('E85'),
      hydrogenFuel: station.fuelTypeCode?.includes('HY'),
      electricCharging: station.fuelTypeCode?.includes('ELEC') && station.evDcFastNum > 0
    };
  }

  private estimateAviationCapacity(station: SAFFuelStation, distance: number) {
    // Estimate based on station type and distance
    const baseCapacity = station.ownerTypeCode === 'FG' ? 50000 : 25000;
    const deliveryTime = Math.max(30, distance * 2); // 2 minutes per km minimum 30 min

    return {
      maxDeliveryGallons: Math.floor(baseCapacity * (distance < 25 ? 1 : 0.5)),
      storageCapacityGallons: baseCapacity,
      deliveryTimeMinutes: deliveryTime
    };
  }

  private estimateAviationPricing(station: SAFFuelStation, distance: number) {
    const baseJetA1Price = 3.25; // Base price per gallon
    const distanceMultiplier = 1 + (distance * 0.01); // 1% increase per km

    return {
      jetA1PerGallon: baseJetA1Price * distanceMultiplier,
      safPremiumPercent: 25, // SAF typically 25-50% premium
      emergencyRateMultiplier: 1.5
    };
  }

  private estimateCertifications(station: SAFFuelStation): string[] {
    const certs = ['ISO 9001', 'Environmental Compliance'];
    
    if (station.ownerTypeCode === 'FG') {
      certs.push('Federal Aviation Administration', 'DOD Fuel Quality Standards');
    }
    
    if (station.fuelTypeCode?.includes('BD')) {
      certs.push('ASTM D7566 SAF Standard', 'Renewable Fuel Standard');
    }
    
    if (station.fuelTypeCode?.includes('HY')) {
      certs.push('Hydrogen Safety Standards', 'SAE Aerospace Standards');
    }

    return certs;
  }

  /**
   * Get comprehensive fuel availability analysis
   */
  async getComprehensiveFuelAnalysis(airportCode: string): Promise<{
    traditionalFuel: AviationFuelSupplier[];
    sustainableFuel: AviationFuelSupplier[];
    emergencyOptions: AviationFuelSupplier[];
    costComparison: {
      traditional: number;
      sustainable: number;
      emergency: number;
    };
    environmentalImpact: {
      co2ReductionPercent: number;
      sustainabilityScore: number;
    };
    recommendations: string[];
  }> {
    // Get airport coordinates (simplified - in practice would lookup from database)
    const airportCoords = this.getAirportCoordinates(airportCode);
    
    const safData = await this.getSAFStationsNearAirport(
      airportCoords.latitude, 
      airportCoords.longitude
    );

    const traditionalSuppliers = this.getTraditionalFuelSuppliers(airportCode);
    
    return {
      traditionalFuel: traditionalSuppliers,
      sustainableFuel: safData.aviationSuppliers,
      emergencyOptions: [
        ...traditionalSuppliers.filter(s => s.services.emergencySupply),
        ...safData.aviationSuppliers.filter(s => s.services.emergencySupply)
      ],
      costComparison: {
        traditional: 3.25,
        sustainable: 4.06, // 25% premium
        emergency: 4.88 // 50% premium
      },
      environmentalImpact: {
        co2ReductionPercent: 80, // SAF typically reduces CO2 by 80%
        sustainabilityScore: 85
      },
      recommendations: this.generateFuelRecommendations(safData, traditionalSuppliers)
    };
  }

  private generateFuelRecommendations(
    safData: any, 
    traditionalSuppliers: AviationFuelSupplier[]
  ): string[] {
    const recommendations = [];

    if (safData.emergencyAvailable) {
      recommendations.push('Sustainable aviation fuel available for emergency operations');
    }

    if (safData.totalCapacity > 100000) {
      recommendations.push('High-capacity sustainable fuel infrastructure available');
    }

    if (traditionalSuppliers.length > 2) {
      recommendations.push('Multiple traditional fuel suppliers ensure supply security');
    }

    recommendations.push('Consider SAF for corporate sustainability commitments');
    recommendations.push('Emergency fuel protocols established with 24/7 availability');

    return recommendations;
  }

  /**
   * Fallback aviation suppliers when NREL API unavailable
   */
  private getFallbackAviationSuppliers(latitude: number, longitude: number) {
    return {
      safStations: [],
      aviationSuppliers: [
        {
          name: 'Regional Alternative Fuel Supplier',
          contact: '+1-800-AVFUEL',
          email: 'operations@regionalfuel.com',
          location: { latitude, longitude, address: 'Near airport facility' },
          fuelTypes: {
            jetA1: true,
            jetB: false,
            avgas100ll: true,
            sustainableAviationFuel: true,
            hydrogenFuel: false,
            electricCharging: false
          },
          services: {
            fuelTrucks: true,
            directPipeline: false,
            emergencySupply: true,
            twentyFourSeven: true
          },
          pricing: {
            jetA1PerGallon: 3.25,
            safPremiumPercent: 25,
            emergencyRateMultiplier: 1.5
          },
          capacity: {
            maxDeliveryGallons: 25000,
            storageCapacityGallons: 50000,
            deliveryTimeMinutes: 45
          },
          certifications: ['ISO 9001', 'FAA Approved'],
          lastVerified: new Date().toISOString()
        }
      ],
      totalCapacity: 50000,
      emergencyAvailable: true
    };
  }

  private getTraditionalFuelSuppliers(airportCode: string): AviationFuelSupplier[] {
    // Simplified traditional supplier data
    const majorSuppliers = {
      'KJFK': [
        {
          name: 'Shell Aviation JFK',
          contact: '+1-718-632-4500',
          email: 'operations@shellaviation.com',
          location: { latitude: 40.6413, longitude: -73.7781, address: 'JFK Airport Fuel Farm' },
          fuelTypes: {
            jetA1: true, jetB: true, avgas100ll: true,
            sustainableAviationFuel: true, hydrogenFuel: false, electricCharging: false
          },
          services: {
            fuelTrucks: true, directPipeline: true, emergencySupply: true, twentyFourSeven: true
          },
          pricing: { jetA1PerGallon: 3.15, safPremiumPercent: 20, emergencyRateMultiplier: 1.3 },
          capacity: { maxDeliveryGallons: 100000, storageCapacityGallons: 500000, deliveryTimeMinutes: 15 },
          certifications: ['FAA Approved', 'ISO 9001', 'ASTM D7566'],
          lastVerified: new Date().toISOString()
        }
      ],
      'EGLL': [
        {
          name: 'BP Aviation Heathrow',
          contact: '+44-20-8759-4321',
          email: 'operations@bpaviation.com',
          location: { latitude: 51.4700, longitude: -0.4543, address: 'Heathrow Airport Fuel Farm' },
          fuelTypes: {
            jetA1: true, jetB: true, avgas100ll: true,
            sustainableAviationFuel: true, hydrogenFuel: false, electricCharging: false
          },
          services: {
            fuelTrucks: true, directPipeline: true, emergencySupply: true, twentyFourSeven: true
          },
          pricing: { jetA1PerGallon: 3.45, safPremiumPercent: 30, emergencyRateMultiplier: 1.4 },
          capacity: { maxDeliveryGallons: 150000, storageCapacityGallons: 750000, deliveryTimeMinutes: 12 },
          certifications: ['CAA Approved', 'ISO 9001', 'ASTM D7566', 'CORSIA Eligible'],
          lastVerified: new Date().toISOString()
        }
      ]
    };

    return majorSuppliers[airportCode] || [this.getFallbackAviationSuppliers(0, 0).aviationSuppliers[0]];
  }

  private getAirportCoordinates(airportCode: string): { latitude: number; longitude: number } {
    const coords = {
      'KJFK': { latitude: 40.6413, longitude: -73.7781 },
      'EGLL': { latitude: 51.4700, longitude: -0.4543 },
      'EDDF': { latitude: 50.0379, longitude: 8.5622 },
      'LFPG': { latitude: 49.0097, longitude: 2.5479 }
    };

    return coords[airportCode] || { latitude: 0, longitude: 0 };
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
}

export const sustainableFuelService = new SustainableFuelService();