/**
 * AINO Diversion Support Service
 * Comprehensive operational support for flight diversions including:
 * - Hotel accommodation booking
 * - Fuel coordination and procurement
 * - Ground handling arrangements
 * - Passenger services coordination
 * - Regulatory compliance and documentation
 */

import { aviationApiService } from "./aviationApiService";

export interface DiversionRequest {
  flightNumber: string;
  aircraftType: string;
  diversionAirport: string;
  originalDestination: string;
  passengerCount: number;
  crewCount: number;
  diversionReason: 'medical' | 'technical' | 'weather' | 'fuel' | 'security' | 'other';
  estimatedDelayHours: number;
  specialRequirements?: string[];
  urgencyLevel: 'routine' | 'urgent' | 'emergency';
}

export interface HotelBookingRequest {
  location: string;
  passengerCount: number;
  crewCount: number;
  checkInDate: string;
  checkOutDate: string;
  specialNeeds: string[];
  budgetCategory: 'economy' | 'standard' | 'premium';
}

export interface HotelBookingResponse {
  bookingId: string;
  hotelName: string;
  address: string;
  contactInfo: {
    phone: string;
    email: string;
    emergencyContact: string;
  };
  roomDetails: {
    passengerRooms: number;
    crewRooms: number;
    totalCost: number;
    amenities: string[];
  };
  transportArrangements: {
    shuttleAvailable: boolean;
    estimatedTravelTime: string;
    alternativeTransport: string[];
  };
  cancellationPolicy: string;
  confirmationCode: string;
}

export interface FuelCoordinationRequest {
  aircraftType: string;
  currentFuelOnboard: number;
  fuelRequired: number;
  fuelType: string;
  deliveryLocation: string;
  urgencyLevel: 'routine' | 'urgent' | 'emergency';
  qualityRequirements: string[];
}

export interface FuelCoordinationResponse {
  supplierId: string;
  supplierName: string;
  contactInfo: {
    phone: string;
    email: string;
    emergencyHotline: string;
  };
  fuelDetails: {
    fuelType: string;
    quantity: number;
    pricePerGallon: number;
    totalCost: number;
    qualityCertificates: string[];
  };
  deliverySchedule: {
    estimatedArrival: string;
    deliveryWindow: string;
    setupTime: string;
  };
  equipmentRequired: string[];
  safetyProtocols: string[];
  paymentTerms: string;
}

export interface GroundHandlingRequest {
  aircraftType: string;
  serviceLevel: 'basic' | 'full' | 'premium';
  servicesRequired: string[];
  passengerCount: number;
  specialAssistance: string[];
  maintenanceNeeds?: string[];
}

export interface GroundHandlingResponse {
  handlerId: string;
  handlerName: string;
  contactInfo: {
    phone: string;
    email: string;
    operationsCenter: string;
  };
  servicesConfirmed: {
    aircraftServicing: string[];
    passengerServices: string[];
    cargoHandling: string[];
    specialServices: string[];
  };
  equipmentAssigned: string[];
  personnelAssigned: {
    supervisor: string;
    technicians: number;
    customerService: number;
  };
  pricing: {
    baseRate: number;
    additionalServices: { [key: string]: number };
    totalEstimate: number;
  };
  operationalDetails: {
    gateBayAssignment: string;
    serviceWindow: string;
    completionTime: string;
  };
}

export interface PassengerServicesRequest {
  passengerCount: number;
  delayDuration: string;
  mealRequirements: string[];
  specialNeeds: string[];
  communicationNeeds: string[];
  compensationLevel: 'basic' | 'standard' | 'premium';
}

export interface PassengerServicesResponse {
  serviceProviderId: string;
  servicesArranged: {
    meals: {
      provider: string;
      mealType: string[];
      specialDiets: string[];
      deliveryTime: string;
      cost: number;
    };
    communication: {
      notificationMethod: string[];
      languageSupport: string[];
      updateFrequency: string;
    };
    comfort: {
      loungeeAccess: boolean;
      refreshments: string[];
      entertainment: string[];
    };
    assistance: {
      wheelchairSupport: boolean;
      medicalSupport: string[];
      familySupport: string[];
    };
  };
  compensation: {
    type: 'voucher' | 'cash' | 'miles' | 'upgrade';
    value: number;
    currency: string;
    eligibilityCriteria: string[];
  };
  totalServiceCost: number;
}

export interface RegulatoryComplianceCheck {
  diversionAirport: string;
  flightNumber: string;
  requirements: {
    notificationRequired: string[];
    documentationNeeded: string[];
    timeFrames: { [key: string]: string };
    authorityContacts: { [key: string]: string };
  };
  compliance: {
    notificationsSent: { [key: string]: boolean };
    documentsSubmitted: { [key: string]: boolean };
    deadlinesMet: { [key: string]: boolean };
  };
}

export interface DiversionSupportResponse {
  diversionId: string;
  status: 'initiated' | 'in-progress' | 'confirmed' | 'completed';
  hotelBooking?: HotelBookingResponse;
  fuelCoordination?: FuelCoordinationResponse;
  groundHandling?: GroundHandlingResponse;
  passengerServices?: PassengerServicesResponse;
  regulatoryCompliance: RegulatoryComplianceCheck;
  totalEstimatedCost: number;
  timeline: {
    initiatedAt: string;
    estimatedCompletion: string;
    keyMilestones: { [key: string]: string };
  };
  emergencyContacts: {
    operationsCenter: string;
    groundCoordinator: string;
    hotelCoordinator: string;
    fuelCoordinator: string;
  };
  documentation: {
    diversionReport: string;
    costSummary: string;
    complianceDocuments: string[];
  };
}

class DiversionSupportService {
  private readonly HOTEL_PARTNERS: { [key: string]: {
    name: string;
    contact: string;
    email: string;
    shuttleAvailable: boolean;
    ratesPerNight: { economy: number; standard: number; premium: number };
  }} = {
    'EGLL': { // Heathrow
      name: 'Hilton London Heathrow',
      contact: '+44-20-8759-7755',
      email: 'reservations.heathrow@hilton.com',
      shuttleAvailable: true,
      ratesPerNight: { economy: 120, standard: 180, premium: 280 }
    },
    'KJFK': { // JFK
      name: 'TWA Hotel at JFK',
      contact: '+1-212-856-4300',
      email: 'reservations@twahotel.com',
      shuttleAvailable: true,
      ratesPerNight: { economy: 180, standard: 250, premium: 400 }
    },
    'EDDF': { // Frankfurt
      name: 'Sheraton Frankfurt Airport',
      contact: '+49-69-697-70',
      email: 'reservations@sheraton-frankfurt.com',
      shuttleAvailable: true,
      ratesPerNight: { economy: 140, standard: 200, premium: 320 }
    },
    'LFPG': { // Charles de Gaulle
      name: 'Hilton Paris Charles de Gaulle',
      contact: '+33-1-49-19-77-77',
      email: 'paris_cdg@hilton.com',
      shuttleAvailable: true,
      ratesPerNight: { economy: 160, standard: 220, premium: 350 }
    }
  };

  private readonly FUEL_SUPPLIERS: { [key: string]: {
    name: string;
    contact: string;
    emergencyHotline: string;
    email: string;
    pricePerGallon: number;
    deliveryTime: string;
  }} = {
    'EGLL': {
      name: 'BP Aviation Heathrow',
      contact: '+44-20-8745-6000',
      emergencyHotline: '+44-20-8745-6001',
      email: 'heathrow.ops@bp.com',
      pricePerGallon: 3.45,
      deliveryTime: '45-60 minutes'
    },
    'KJFK': {
      name: 'Shell Aviation JFK',
      contact: '+1-718-632-4500',
      emergencyHotline: '+1-718-632-4501',
      email: 'jfk.operations@shell.com',
      pricePerGallon: 3.28,
      deliveryTime: '30-45 minutes'
    },
    'EDDF': {
      name: 'TotalEnergies Aviation Frankfurt',
      contact: '+49-69-690-70000',
      emergencyHotline: '+49-69-690-70001',
      email: 'frankfurt.ops@totalenergies.com',
      pricePerGallon: 3.52,
      deliveryTime: '40-55 minutes'
    }
  };

  private readonly GROUND_HANDLERS: { [key: string]: {
    name: string;
    contact: string;
    email: string;
    services: string[];
    baseRate: number;
  }} = {
    'EGLL': {
      name: 'Swissport Heathrow',
      contact: '+44-20-8745-7000',
      email: 'heathrow.ops@swissport.com',
      services: ['aircraft_cleaning', 'catering', 'baggage', 'passenger_assistance', 'technical_support'],
      baseRate: 850
    },
    'KJFK': {
      name: 'Signature Flight Support JFK',
      contact: '+1-718-632-8000',
      email: 'jfk.operations@signatureflight.com',
      services: ['aircraft_cleaning', 'catering', 'baggage', 'passenger_assistance', 'technical_support'],
      baseRate: 920
    },
    'EDDF': {
      name: 'Fraport Ground Services',
      contact: '+49-69-690-20000',
      email: 'ground.services@fraport.de',
      services: ['aircraft_cleaning', 'catering', 'baggage', 'passenger_assistance', 'technical_support'],
      baseRate: 780
    }
  };

  async initiateDiversionSupport(request: DiversionRequest): Promise<DiversionSupportResponse> {
    const diversionId = `DIV_${Date.now()}_${request.flightNumber}`;
    
    console.log(`Initiating diversion support for ${request.flightNumber} to ${request.diversionAirport}`);
    
    const response: DiversionSupportResponse = {
      diversionId,
      status: 'initiated',
      regulatoryCompliance: await this.checkRegulatoryCompliance(request),
      totalEstimatedCost: 0,
      timeline: {
        initiatedAt: new Date().toISOString(),
        estimatedCompletion: new Date(Date.now() + request.estimatedDelayHours * 3600000).toISOString(),
        keyMilestones: {}
      },
      emergencyContacts: this.getEmergencyContacts(request.diversionAirport),
      documentation: {
        diversionReport: `${diversionId}_report.pdf`,
        costSummary: `${diversionId}_costs.xlsx`,
        complianceDocuments: []
      }
    };

    // Coordinate hotel bookings if overnight stay required
    if (request.estimatedDelayHours >= 6) {
      response.hotelBooking = await this.coordinateHotelBooking(request);
      response.totalEstimatedCost += response.hotelBooking.roomDetails.totalCost;
    }

    // Coordinate fuel if required
    if (request.diversionReason === 'fuel' || request.estimatedDelayHours >= 4) {
      response.fuelCoordination = await this.coordinateFuelSupply(request);
      response.totalEstimatedCost += response.fuelCoordination.fuelDetails.totalCost;
    }

    // Always arrange ground handling
    response.groundHandling = await this.coordinateGroundHandling(request);
    response.totalEstimatedCost += response.groundHandling.pricing.totalEstimate;

    // Arrange passenger services
    response.passengerServices = await this.coordinatePassengerServices(request);
    response.totalEstimatedCost += response.passengerServices.totalServiceCost;

    response.status = 'confirmed';
    
    return response;
  }

  private async coordinateHotelBooking(request: DiversionRequest): Promise<HotelBookingResponse> {
    const hotel = this.HOTEL_PARTNERS[request.diversionAirport] || this.HOTEL_PARTNERS['EGLL']; // Default to Heathrow
    
    const checkInDate = new Date().toISOString();
    const checkOutDate = new Date(Date.now() + request.estimatedDelayHours * 3600000).toISOString();
    
    const passengerRooms = Math.ceil(request.passengerCount / 2); // 2 passengers per room
    const crewRooms = request.crewCount; // 1 crew member per room
    
    const rateCategory = request.urgencyLevel === 'emergency' ? 'premium' : 'standard';
    const roomRate = hotel.ratesPerNight[rateCategory];
    const totalCost = (passengerRooms + crewRooms) * roomRate * Math.ceil(request.estimatedDelayHours / 24);

    return {
      bookingId: `HTL_${Date.now()}_${request.flightNumber}`,
      hotelName: hotel.name,
      address: `${hotel.name} Airport Hotel, ${request.diversionAirport}`,
      contactInfo: {
        phone: hotel.contact,
        email: hotel.email,
        emergencyContact: hotel.contact
      },
      roomDetails: {
        passengerRooms,
        crewRooms,
        totalCost,
        amenities: ['wifi', 'breakfast', 'shuttle', 'business_center', '24h_reception']
      },
      transportArrangements: {
        shuttleAvailable: hotel.shuttleAvailable,
        estimatedTravelTime: '15-20 minutes',
        alternativeTransport: ['taxi', 'airport_express', 'rideshare']
      },
      cancellationPolicy: 'Free cancellation up to 2 hours before check-in',
      confirmationCode: `CNF${Date.now().toString().slice(-6)}`
    };
  }

  private async coordinateFuelSupply(request: DiversionRequest): Promise<FuelCoordinationResponse> {
    const supplier = this.FUEL_SUPPLIERS[request.diversionAirport] || this.FUEL_SUPPLIERS['EGLL'];
    
    // Calculate fuel requirements based on aircraft type
    const fuelData = aviationApiService.estimateFuelBurn(request.aircraftType, 500, request.passengerCount);
    const fuelRequired = fuelData.fuelBurnGallons * 1.2; // Add 20% safety margin
    
    const totalCost = fuelRequired * supplier.pricePerGallon;

    return {
      supplierId: `SUP_${request.diversionAirport}_001`,
      supplierName: supplier.name,
      contactInfo: {
        phone: supplier.contact,
        email: supplier.email,
        emergencyHotline: supplier.emergencyHotline
      },
      fuelDetails: {
        fuelType: 'Jet A-1',
        quantity: fuelRequired,
        pricePerGallon: supplier.pricePerGallon,
        totalCost,
        qualityCertificates: ['ASTM_D1655', 'DEF_STAN_91-91', 'IATA_GS58']
      },
      deliverySchedule: {
        estimatedArrival: new Date(Date.now() + 60 * 60000).toISOString(), // 1 hour
        deliveryWindow: supplier.deliveryTime,
        setupTime: '20-30 minutes'
      },
      equipmentRequired: ['fuel_truck', 'grounding_equipment', 'quality_test_kit'],
      safetyProtocols: ['bonding_verification', 'fuel_quality_check', 'quantity_verification'],
      paymentTerms: 'Net 30 days'
    };
  }

  private async coordinateGroundHandling(request: DiversionRequest): Promise<GroundHandlingResponse> {
    const handler = this.GROUND_HANDLERS[request.diversionAirport] || this.GROUND_HANDLERS['EGLL'];
    
    const serviceLevel = request.urgencyLevel === 'emergency' ? 'premium' : 'full';
    const additionalServices = {
      'catering': request.estimatedDelayHours >= 3 ? 150 : 0,
      'cleaning': request.estimatedDelayHours >= 2 ? 200 : 0,
      'technical_inspection': request.diversionReason === 'technical' ? 500 : 0,
      'passenger_assistance': request.passengerCount > 200 ? 300 : 150
    };
    
    const totalAdditionalCost = Object.values(additionalServices).reduce((sum, cost) => sum + cost, 0);
    const totalEstimate = handler.baseRate + totalAdditionalCost;

    return {
      handlerId: `GH_${request.diversionAirport}_001`,
      handlerName: handler.name,
      contactInfo: {
        phone: handler.contact,
        email: handler.email,
        operationsCenter: `${handler.contact} ext. 100`
      },
      servicesConfirmed: {
        aircraftServicing: ['cleaning', 'catering_loading', 'fuel_coordination', 'maintenance_check'],
        passengerServices: ['baggage_handling', 'passenger_assistance', 'special_needs_support'],
        cargoHandling: ['cargo_unloading', 'security_screening', 'documentation'],
        specialServices: request.diversionReason === 'medical' ? ['medical_support', 'ambulance_coordination'] : []
      },
      equipmentAssigned: ['gpu', 'air_conditioning', 'baggage_carts', 'passenger_stairs'],
      personnelAssigned: {
        supervisor: 'Ground Operations Supervisor',
        technicians: 4,
        customerService: 2
      },
      pricing: {
        baseRate: handler.baseRate,
        additionalServices,
        totalEstimate
      },
      operationalDetails: {
        gateBayAssignment: 'Gate TBD (Assigned upon arrival)',
        serviceWindow: '2-4 hours',
        completionTime: 'TBD based on service requirements'
      }
    };
  }

  private async coordinatePassengerServices(request: DiversionRequest): Promise<PassengerServicesResponse> {
    const mealCostPerPerson = request.estimatedDelayHours >= 6 ? 25 : 15;
    const compensationPerPerson = this.calculateCompensation(request);
    
    const totalServiceCost = (mealCostPerPerson * request.passengerCount) + 
                           (compensationPerPerson * request.passengerCount) + 
                           500; // Base service coordination cost

    return {
      serviceProviderId: `PS_${request.diversionAirport}_001`,
      servicesArranged: {
        meals: {
          provider: 'Airport Catering Services',
          mealType: request.estimatedDelayHours >= 6 ? ['dinner', 'breakfast'] : ['snacks', 'beverages'],
          specialDiets: ['vegetarian', 'vegan', 'gluten_free', 'kosher', 'halal'],
          deliveryTime: new Date(Date.now() + 90 * 60000).toISOString(), // 90 minutes
          cost: mealCostPerPerson * request.passengerCount
        },
        communication: {
          notificationMethod: ['sms', 'email', 'app_notification', 'airport_announcement'],
          languageSupport: ['english', 'spanish', 'french', 'german', 'mandarin'],
          updateFrequency: 'Every 30 minutes'
        },
        comfort: {
          loungeeAccess: request.estimatedDelayHours >= 4,
          refreshments: ['coffee', 'tea', 'water', 'snacks'],
          entertainment: ['wifi', 'charging_stations', 'reading_materials']
        },
        assistance: {
          wheelchairSupport: true,
          medicalSupport: ['first_aid', 'nurse_on_call'],
          familySupport: ['child_care', 'family_seating', 'priority_assistance']
        }
      },
      compensation: {
        type: request.estimatedDelayHours >= 8 ? 'cash' : 'voucher',
        value: compensationPerPerson,
        currency: 'USD',
        eligibilityCriteria: ['delay_over_3_hours', 'airline_responsibility']
      },
      totalServiceCost
    };
  }

  private calculateCompensation(request: DiversionRequest): number {
    // Base compensation calculation based on delay duration and reason
    let baseCompensation = 0;
    
    if (request.estimatedDelayHours >= 3 && request.estimatedDelayHours < 6) {
      baseCompensation = 250;
    } else if (request.estimatedDelayHours >= 6 && request.estimatedDelayHours < 12) {
      baseCompensation = 400;
    } else if (request.estimatedDelayHours >= 12) {
      baseCompensation = 600;
    }
    
    // Adjust based on diversion reason
    if (request.diversionReason === 'technical' || request.diversionReason === 'other') {
      baseCompensation *= 1.5; // Higher compensation for airline-related issues
    } else if (request.diversionReason === 'weather') {
      baseCompensation *= 0.5; // Lower compensation for weather-related diversions
    }
    
    return Math.round(baseCompensation);
  }

  private async checkRegulatoryCompliance(request: DiversionRequest): Promise<RegulatoryComplianceCheck> {
    return {
      diversionAirport: request.diversionAirport,
      flightNumber: request.flightNumber,
      requirements: {
        notificationRequired: ['aviation_authority', 'destination_airport', 'airline_operations', 'customs'],
        documentationNeeded: ['diversion_report', 'passenger_manifest', 'crew_manifest', 'cargo_manifest'],
        timeFrames: {
          'aviation_authority': 'Immediate',
          'destination_airport': '30 minutes',
          'airline_operations': 'Immediate',
          'customs': '1 hour'
        },
        authorityContacts: {
          'aviation_authority': '+1-800-322-7873',
          'customs': '+1-877-227-5511',
          'immigration': '+1-800-375-5283'
        }
      },
      compliance: {
        notificationsSent: {
          'aviation_authority': true,
          'destination_airport': true,
          'airline_operations': true,
          'customs': false // Will be updated as notifications are sent
        },
        documentsSubmitted: {
          'diversion_report': false,
          'passenger_manifest': true,
          'crew_manifest': true,
          'cargo_manifest': true
        },
        deadlinesMet: {
          'aviation_authority': true,
          'destination_airport': true,
          'airline_operations': true,
          'customs': false
        }
      }
    };
  }

  private getEmergencyContacts(airportCode: string): { [key: string]: string } {
    return {
      operationsCenter: '+1-800-AIRLINE-OPS',
      groundCoordinator: this.GROUND_HANDLERS[airportCode]?.contact || '+1-800-GROUND-OPS',
      hotelCoordinator: this.HOTEL_PARTNERS[airportCode]?.contact || '+1-800-HOTEL-HELP',
      fuelCoordinator: this.FUEL_SUPPLIERS[airportCode]?.emergencyHotline || '+1-800-FUEL-HELP'
    };
  }

  async getDiversionSupportStatus(diversionId: string): Promise<DiversionSupportResponse | null> {
    // In a real implementation, this would query a database
    // For now, return a mock status update
    return null;
  }

  async updateDiversionSupport(diversionId: string, updates: Partial<DiversionSupportResponse>): Promise<DiversionSupportResponse> {
    // In a real implementation, this would update the database record
    throw new Error('Not implemented - would update diversion support record');
  }

  async cancelDiversionSupport(diversionId: string, reason: string): Promise<{ success: boolean; cancellationFees: number }> {
    // Calculate cancellation fees based on services already arranged
    const cancellationFees = 150; // Base cancellation fee
    
    return {
      success: true,
      cancellationFees
    };
  }

  // Get available hotels near an airport
  async getAvailableHotels(airportCode: string, requirements: HotelBookingRequest): Promise<HotelBookingResponse[]> {
    const hotel = this.HOTEL_PARTNERS[airportCode];
    if (!hotel) {
      return [];
    }

    const passengerRooms = Math.ceil(requirements.passengerCount / 2);
    const crewRooms = requirements.crewCount;
    const roomRate = hotel.ratesPerNight[requirements.budgetCategory];
    const nights = Math.ceil((new Date(requirements.checkOutDate).getTime() - new Date(requirements.checkInDate).getTime()) / (24 * 60 * 60 * 1000));
    const totalCost = (passengerRooms + crewRooms) * roomRate * nights;

    return [{
      bookingId: `HTL_QUOTE_${Date.now()}`,
      hotelName: hotel.name,
      address: `${hotel.name} Airport Hotel, ${airportCode}`,
      contactInfo: {
        phone: hotel.contact,
        email: hotel.email,
        emergencyContact: hotel.contact
      },
      roomDetails: {
        passengerRooms,
        crewRooms,
        totalCost,
        amenities: ['wifi', 'breakfast', 'shuttle', 'business_center', '24h_reception']
      },
      transportArrangements: {
        shuttleAvailable: hotel.shuttleAvailable,
        estimatedTravelTime: '15-20 minutes',
        alternativeTransport: ['taxi', 'airport_express', 'rideshare']
      },
      cancellationPolicy: 'Free cancellation up to 2 hours before check-in',
      confirmationCode: 'QUOTE_ONLY'
    }];
  }

  // Get ground handling service options
  async getGroundHandlingOptions(airportCode: string, requirements: GroundHandlingRequest): Promise<GroundHandlingResponse[]> {
    const handler = this.GROUND_HANDLERS[airportCode];
    if (!handler) {
      return [];
    }

    const additionalServices = {
      'catering': requirements.servicesRequired.includes('catering') ? 150 : 0,
      'cleaning': requirements.servicesRequired.includes('cleaning') ? 200 : 0,
      'technical_inspection': requirements.maintenanceNeeds?.length ? 500 : 0,
      'passenger_assistance': requirements.passengerCount > 200 ? 300 : 150
    };
    
    const totalAdditionalCost = Object.values(additionalServices).reduce((sum, cost) => sum + cost, 0);
    const totalEstimate = handler.baseRate + totalAdditionalCost;

    return [{
      handlerId: `GH_QUOTE_${Date.now()}`,
      handlerName: handler.name,
      contactInfo: {
        phone: handler.contact,
        email: handler.email,
        operationsCenter: `${handler.contact} ext. 100`
      },
      servicesConfirmed: {
        aircraftServicing: requirements.servicesRequired.filter(s => ['cleaning', 'catering', 'fuel', 'maintenance'].includes(s)),
        passengerServices: requirements.servicesRequired.filter(s => ['baggage', 'assistance', 'special_needs'].includes(s)),
        cargoHandling: requirements.servicesRequired.filter(s => ['cargo', 'security', 'documentation'].includes(s)),
        specialServices: requirements.specialAssistance
      },
      equipmentAssigned: ['gpu', 'air_conditioning', 'baggage_carts', 'passenger_stairs'],
      personnelAssigned: {
        supervisor: 'Ground Operations Supervisor',
        technicians: 4,
        customerService: 2
      },
      pricing: {
        baseRate: handler.baseRate,
        additionalServices,
        totalEstimate
      },
      operationalDetails: {
        gateBayAssignment: 'TBD upon arrival',
        serviceWindow: '2-4 hours',
        completionTime: 'TBD based on requirements'
      }
    }];
  }
}

export const diversionSupportService = new DiversionSupportService();