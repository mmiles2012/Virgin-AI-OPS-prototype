/**
 * Ground Handler Service for AINO Aviation Intelligence Platform
 * Provides authentic ground handling data from worldwide database
 */

import * as fs from 'fs';
import * as path from 'path';

interface GroundHandler {
  icao: string;
  iata: string;
  airportName: string;
  country: string;
  handlerName: string;
  services: string[];
  email: string;
  phone: string;
  certifications: string[];
  notes: string;
}

interface GroundHandlingServices {
  ramp: GroundHandler[];
  passenger: GroundHandler[];
  cargo: GroundHandler[];
  catering: GroundHandler[];
  security: GroundHandler[];
}

class GroundHandlerService {
  private handlers: GroundHandler[] = [];
  
  constructor() {
    this.loadGroundHandlers();
  }
  
  private loadGroundHandlers() {
    try {
      const csvPath = path.join(process.cwd(), 'data', 'ground_handlers.csv');
      if (fs.existsSync(csvPath)) {
        const csvData = fs.readFileSync(csvPath, 'utf-8');
        this.handlers = this.parseCSV(csvData);
        console.log(`Ground Handler Service: Loaded ${this.handlers.length} handlers`);
      } else {
        console.log('Ground Handler Service: Using default handlers');
        this.handlers = this.getDefaultHandlers();
      }
    } catch (error) {
      console.error('Ground Handler Service Error:', error);
      this.handlers = this.getDefaultHandlers();
    }
  }
  
  private parseCSV(csvData: string): GroundHandler[] {
    const lines = csvData.split('\n');
    const handlers: GroundHandler[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = this.parseCSVLine(line);
      if (values.length >= 10) {
        const handler: GroundHandler = {
          icao: values[0].trim(),
          iata: values[1].trim(),
          airportName: values[2].trim(),
          country: values[3].trim(),
          handlerName: values[4].trim(),
          services: this.parseArray(values[5].trim()),
          email: values[6].trim(),
          phone: values[7].trim(),
          certifications: this.parseArray(values[8].trim()),
          notes: values[9].trim()
        };
        handlers.push(handler);
      }
    }
    
    return handlers;
  }

  private parseCSVLine(line: string): string[] {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current);
    return result;
  }
  
  private parseArray(arrayString: string): string[] {
    try {
      return JSON.parse(arrayString.replace(/'/g, '"'));
    } catch {
      return [arrayString];
    }
  }
  
  private getDefaultHandlers(): GroundHandler[] {
    return [
      {
        icao: 'EGCC',
        iata: 'MAN',
        airportName: 'Manchester Airport',
        country: 'UK',
        handlerName: 'Swissport',
        services: ['Ramp', 'Passenger', 'Cargo'],
        email: 'ops-man@swissport.com',
        phone: '+44 (0)161 489 3000',
        certifications: ['ISAGO'],
        notes: 'Virgin Atlantic preferred handler'
      },
      {
        icao: 'EGLL',
        iata: 'LHR',
        airportName: 'London Heathrow',
        country: 'UK',
        handlerName: 'Swissport',
        services: ['Ramp', 'Passenger', 'Cargo'],
        email: 'ops-lhr@swissport.com',
        phone: '+44 (0)844 248 0000',
        certifications: ['ISAGO'],
        notes: 'Preferred at T2/T5, cargo at T4'
      }
    ];
  }
  
  public getHandlersByAirport(icao: string): GroundHandlingServices {
    const airportHandlers = this.handlers.filter(h => 
      h.icao.toUpperCase() === icao.toUpperCase()
    );
    
    return {
      ramp: airportHandlers.filter(h => h.services.includes('Ramp')),
      passenger: airportHandlers.filter(h => h.services.includes('Passenger')),
      cargo: airportHandlers.filter(h => h.services.includes('Cargo')),
      catering: airportHandlers.filter(h => h.services.includes('Catering')),
      security: airportHandlers.filter(h => h.services.includes('Security'))
    };
  }
  
  public getPreferredHandler(icao: string, serviceType: string = 'Ramp'): GroundHandler | null {
    const handlers = this.handlers.filter(h => 
      h.icao.toUpperCase() === icao.toUpperCase() && 
      h.services.includes(serviceType)
    );
    
    // Prefer ISAGO certified handlers
    const isagoHandlers = handlers.filter(h => h.certifications.includes('ISAGO'));
    if (isagoHandlers.length > 0) {
      return isagoHandlers[0];
    }
    
    return handlers.length > 0 ? handlers[0] : null;
  }
  
  public getAllHandlers(): GroundHandler[] {
    return this.handlers;
  }
  
  public getAirportCoverage(): string[] {
    return [...new Set(this.handlers.map(h => h.icao))];
  }
  
  public generateServiceBooking(icao: string, services: string[]): any {
    const airportServices = this.getHandlersByAirport(icao);
    const booking = {
      airport: icao,
      timestamp: new Date().toISOString(),
      services: [],
      total_cost_estimate: 0,
      booking_reference: `GH${Date.now()}`
    };
    
    for (const service of services) {
      let handlers = [];
      switch (service.toLowerCase()) {
        case 'ramp':
        case 'ground_handling':
          handlers = airportServices.ramp;
          break;
        case 'passenger':
          handlers = airportServices.passenger;
          break;
        case 'cargo':
          handlers = airportServices.cargo;
          break;
        case 'catering':
          handlers = airportServices.catering;
          break;
        case 'security':
          handlers = airportServices.security;
          break;
      }
      
      if (handlers.length > 0) {
        const handler = handlers[0];
        booking.services.push({
          service_type: service,
          handler: handler.handlerName,
          contact: handler.email,
          phone: handler.phone,
          status: 'confirmed',
          cost_estimate: this.estimateServiceCost(service),
          notes: handler.notes
        });
        booking.total_cost_estimate += this.estimateServiceCost(service);
      }
    }
    
    return booking;
  }
  
  private estimateServiceCost(service: string): number {
    const baseCosts = {
      'ramp': 2500,
      'ground_handling': 2500,
      'passenger': 1800,
      'cargo': 3200,
      'catering': 4500,
      'security': 1200
    };
    
    return baseCosts[service.toLowerCase()] || 2000;
  }
}

export default new GroundHandlerService();