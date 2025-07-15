/**
 * AINO Diversion Support Service
 * Comprehensive operational support for flight diversions
 */

export interface DiversionRequest {
  flightNumber: string;
  aircraftType: string;
  diversionAirport: string;
  originalDestination: string;
  passengerCount: number;
  crewCount: number;
  diversionReason: 'medical' | 'technical' | 'weather' | 'fuel' | 'security' | 'other';
  estimatedDelayHours: number;
  urgencyLevel: 'routine' | 'urgent' | 'emergency';
}

export interface DiversionSupportResponse {
  diversionId: string;
  status: 'initiated' | 'in-progress' | 'confirmed' | 'completed';
  hotelBooking?: {
    bookingId: string;
    hotelName: string;
    address: string;
    contactPhone: string;
    passengerRooms: number;
    crewRooms: number;
    totalCost: number;
    confirmationCode: string;
  };
  fuelCoordination?: {
    supplierId: string;
    supplierName: string;
    contactPhone: string;
    fuelQuantity: number;
    pricePerGallon: number;
    totalCost: number;
    estimatedDelivery: string;
  };
  groundHandling?: {
    handlerId: string;
    handlerName: string;
    contactPhone: string;
    servicesConfirmed: string[];
    totalCost: number;
    estimatedCompletion: string;
  };
  passengerServices?: {
    mealArrangements: {
      provider: string;
      mealTypes: string[];
      cost: number;
    };
    compensation: {
      type: string;
      valuePerPerson: number;
      totalValue: number;
    };
    totalServiceCost: number;
  };
  totalEstimatedCost: number;
  timeline: {
    initiatedAt: string;
    estimatedCompletion: string;
  };
  emergencyContacts: {
    operationsCenter: string;
    groundCoordinator: string;
    hotelCoordinator: string;
    fuelCoordinator: string;
  };
}

class DiversionSupportService {
  private readonly hotelPartners = {
    'EGLL': { name: 'Hilton London Heathrow', contact: '+44-20-8759-7755', rates: { economy: 120, standard: 180, premium: 280 } },
    'KJFK': { name: 'TWA Hotel at JFK', contact: '+1-212-856-4300', rates: { economy: 180, standard: 250, premium: 400 } },
    'EDDF': { name: 'Sheraton Frankfurt Airport', contact: '+49-69-697-70', rates: { economy: 140, standard: 200, premium: 320 } },
    'LFPG': { name: 'Hilton Paris Charles de Gaulle', contact: '+33-1-49-19-77-77', rates: { economy: 160, standard: 220, premium: 350 } }
  };

  private readonly fuelSuppliers = {
    'EGLL': { name: 'BP Aviation Heathrow', contact: '+44-20-8745-6000', pricePerGallon: 3.45 },
    'KJFK': { name: 'Shell Aviation JFK', contact: '+1-718-632-4500', pricePerGallon: 3.28 },
    'EDDF': { name: 'TotalEnergies Aviation Frankfurt', contact: '+49-69-690-70000', pricePerGallon: 3.52 },
    'LFPG': { name: 'Total Aviation Paris CDG', contact: '+33-1-49-75-15-15', pricePerGallon: 3.58 }
  };

  private readonly groundHandlers = {
    'EGLL': { name: 'Swissport Heathrow', contact: '+44-20-8745-7000', baseRate: 850 },
    'KJFK': { name: 'Signature Flight Support JFK', contact: '+1-718-632-8000', baseRate: 920 },
    'EDDF': { name: 'Fraport Ground Services', contact: '+49-69-690-20000', baseRate: 780 },
    'LFPG': { name: 'SAGS Charles de Gaulle', contact: '+33-1-49-75-43-21', baseRate: 810 }
  };

  async initiateDiversionSupport(request: DiversionRequest): Promise<DiversionSupportResponse> {
    const diversionId = `DIV_${Date.now()}_${request.flightNumber}`;
    
    console.log(`Initiating diversion support for ${request.flightNumber} to ${request.diversionAirport}`);
    
    let totalCost = 0;
    const response: DiversionSupportResponse = {
      diversionId,
      status: 'initiated',
      totalEstimatedCost: 0,
      timeline: {
        initiatedAt: new Date().toISOString(),
        estimatedCompletion: new Date(Date.now() + request.estimatedDelayHours * 3600000).toISOString()
      },
      emergencyContacts: {
        operationsCenter: '+1-800-AIRLINE-OPS',
        groundCoordinator: this.getGroundContact(request.diversionAirport),
        hotelCoordinator: this.getHotelContact(request.diversionAirport),
        fuelCoordinator: this.getFuelContact(request.diversionAirport)
      }
    };

    // Hotel booking if overnight stay required
    if (request.estimatedDelayHours >= 6) {
      const hotel = this.hotelPartners[request.diversionAirport as keyof typeof this.hotelPartners];
      if (hotel) {
        const passengerRooms = Math.ceil(request.passengerCount / 2);
        const crewRooms = request.crewCount;
        const rateType = request.urgencyLevel === 'emergency' ? 'premium' : 'standard';
        const roomRate = hotel.rates[rateType as keyof typeof hotel.rates];
        const nights = Math.ceil(request.estimatedDelayHours / 24);
        const hotelCost = (passengerRooms + crewRooms) * roomRate * nights;
        
        response.hotelBooking = {
          bookingId: `HTL_${Date.now()}`,
          hotelName: hotel.name,
          address: `${hotel.name}, ${request.diversionAirport}`,
          contactPhone: hotel.contact,
          passengerRooms,
          crewRooms,
          totalCost: hotelCost,
          confirmationCode: `CNF${Date.now().toString().slice(-6)}`
        };
        totalCost += hotelCost;
      }
    }

    // Fuel coordination if needed
    if (request.diversionReason === 'fuel' || request.estimatedDelayHours >= 4) {
      const fuel = this.fuelSuppliers[request.diversionAirport as keyof typeof this.fuelSuppliers];
      if (fuel) {
        const fuelRequired = this.calculateFuelRequirement(request.aircraftType, request.passengerCount);
        const fuelCost = fuelRequired * fuel.pricePerGallon;
        
        response.fuelCoordination = {
          supplierId: `FUEL_${request.diversionAirport}`,
          supplierName: fuel.name,
          contactPhone: fuel.contact,
          fuelQuantity: fuelRequired,
          pricePerGallon: fuel.pricePerGallon,
          totalCost: fuelCost,
          estimatedDelivery: new Date(Date.now() + 60 * 60000).toISOString()
        };
        totalCost += fuelCost;
      }
    }

    // Ground handling services
    const groundHandler = this.groundHandlers[request.diversionAirport as keyof typeof this.groundHandlers];
    if (groundHandler) {
      const additionalServices = this.calculateAdditionalServices(request);
      const groundCost = groundHandler.baseRate + additionalServices;
      
      response.groundHandling = {
        handlerId: `GH_${request.diversionAirport}`,
        handlerName: groundHandler.name,
        contactPhone: groundHandler.contact,
        servicesConfirmed: ['aircraft_cleaning', 'baggage_handling', 'passenger_assistance'],
        totalCost: groundCost,
        estimatedCompletion: new Date(Date.now() + 3 * 3600000).toISOString()
      };
      totalCost += groundCost;
    }

    // Passenger services
    const mealCost = request.passengerCount * (request.estimatedDelayHours >= 6 ? 25 : 15);
    const compensationPerPerson = this.calculateCompensation(request);
    const passengerServiceCost = mealCost + (request.passengerCount * compensationPerPerson);
    
    response.passengerServices = {
      mealArrangements: {
        provider: 'Airport Catering Services',
        mealTypes: request.estimatedDelayHours >= 6 ? ['dinner', 'breakfast'] : ['snacks', 'beverages'],
        cost: mealCost
      },
      compensation: {
        type: request.estimatedDelayHours >= 8 ? 'cash' : 'voucher',
        valuePerPerson: compensationPerPerson,
        totalValue: request.passengerCount * compensationPerPerson
      },
      totalServiceCost: passengerServiceCost
    };
    totalCost += passengerServiceCost;

    response.totalEstimatedCost = Math.round(totalCost);
    response.status = 'confirmed';
    
    return response;
  }

  private getHotelContact(airportCode: string): string {
    const hotel = this.hotelPartners[airportCode as keyof typeof this.hotelPartners];
    return hotel ? hotel.contact : '+1-800-HOTEL-HELP';
  }

  private getFuelContact(airportCode: string): string {
    const fuel = this.fuelSuppliers[airportCode as keyof typeof this.fuelSuppliers];
    return fuel ? fuel.contact : '+1-800-FUEL-HELP';
  }

  private getGroundContact(airportCode: string): string {
    const ground = this.groundHandlers[airportCode as keyof typeof this.groundHandlers];
    return ground ? ground.contact : '+1-800-GROUND-OPS';
  }

  private calculateFuelRequirement(aircraftType: string, passengerCount: number): number {
    // Simplified fuel calculation based on aircraft type
    const baseFuel = {
      'Boeing 787': 2500,
      'Airbus A350': 2800,
      'Boeing 777': 3200,
      'Airbus A330': 2600
    };
    
    const typeKey = Object.keys(baseFuel).find(type => aircraftType.includes(type.split(' ')[1]));
    const baseRequirement = typeKey ? baseFuel[typeKey as keyof typeof baseFuel] : 2500;
    
    // Add 20% safety margin
    return Math.round(baseRequirement * 1.2);
  }

  private calculateAdditionalServices(request: DiversionRequest): number {
    let additional = 0;
    
    if (request.estimatedDelayHours >= 3) additional += 150; // Catering
    if (request.estimatedDelayHours >= 2) additional += 200; // Cleaning
    if (request.diversionReason === 'technical') additional += 500; // Technical inspection
    if (request.passengerCount > 200) additional += 300; // Extra passenger assistance
    if (request.diversionReason === 'medical') additional += 250; // Medical support
    
    return additional;
  }

  private calculateCompensation(request: DiversionRequest): number {
    let baseCompensation = 0;
    
    if (request.estimatedDelayHours >= 3 && request.estimatedDelayHours < 6) {
      baseCompensation = 250;
    } else if (request.estimatedDelayHours >= 6 && request.estimatedDelayHours < 12) {
      baseCompensation = 400;
    } else if (request.estimatedDelayHours >= 12) {
      baseCompensation = 600;
    }
    
    // Adjust based on diversion reason
    if (request.diversionReason === 'technical') {
      baseCompensation *= 1.5; // Higher compensation for technical issues
    } else if (request.diversionReason === 'weather') {
      baseCompensation *= 0.5; // Lower compensation for weather
    }
    
    return Math.round(baseCompensation);
  }

  async getAvailableServices(airportCode: string): Promise<{
    hotels: Array<{ name: string; contact: string; available: boolean }>;
    fuelSuppliers: Array<{ name: string; contact: string; available: boolean }>;
    groundHandlers: Array<{ name: string; contact: string; available: boolean }>;
  }> {
    const hotel = this.hotelPartners[airportCode as keyof typeof this.hotelPartners];
    const fuel = this.fuelSuppliers[airportCode as keyof typeof this.fuelSuppliers];
    const ground = this.groundHandlers[airportCode as keyof typeof this.groundHandlers];

    return {
      hotels: hotel ? [{ name: hotel.name, contact: hotel.contact, available: true }] : [],
      fuelSuppliers: fuel ? [{ name: fuel.name, contact: fuel.contact, available: true }] : [],
      groundHandlers: ground ? [{ name: ground.name, contact: ground.contact, available: true }] : []
    };
  }

  async cancelDiversionSupport(diversionId: string): Promise<{ success: boolean; cancellationFees: number }> {
    // Calculate cancellation fees based on timing
    const cancellationFees = 150; // Base cancellation fee
    
    return {
      success: true,
      cancellationFees
    };
  }
}

export const diversionSupport = new DiversionSupportService();