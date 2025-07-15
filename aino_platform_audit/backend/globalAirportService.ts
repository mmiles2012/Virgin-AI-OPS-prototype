/**
 * Global Airport Service for AINO Aviation Intelligence Platform
 * Handles comprehensive airport database with 83,000+ global airports
 */

import * as fs from 'fs';
import * as path from 'path';

interface GlobalAirport {
  id: string;
  ident: string;
  type: 'large_airport' | 'medium_airport' | 'small_airport' | 'heliport' | 'seaplane_base' | 'balloonport' | 'closed';
  name: string;
  latitude_deg: number;
  longitude_deg: number;
  elevation_ft: number;
  continent: string;
  iso_country: string;
  iso_region: string;
  municipality: string;
  scheduled_service: 'yes' | 'no';
  icao_code: string;
  iata_code: string;
  gps_code: string;
  local_code: string;
  home_link: string;
  wikipedia_link: string;
  keywords: string;
  runway_lighted: boolean;
  faa_locid: string;
  faa_airport_name: string;
  faa_class: string;
  arff_index: string;
}

interface AirportFilter {
  country?: string;
  continent?: string;
  type?: string[];
  scheduledService?: boolean;
  hasICAO?: boolean;
  hasIATA?: boolean;
  region?: string;
  minLat?: number;
  maxLat?: number;
  minLon?: number;
  maxLon?: number;
  nearPoint?: { lat: number; lon: number; radiusKm: number };
}

class GlobalAirportService {
  private airports: GlobalAirport[] = [];
  private airportsByICAO: Map<string, GlobalAirport> = new Map();
  private airportsByIATA: Map<string, GlobalAirport> = new Map();
  private airportsByCountry: Map<string, GlobalAirport[]> = new Map();
  private loaded = false;

  constructor() {
    this.loadAirports();
  }

  private loadAirports(): void {
    try {
      const csvPath = path.join(process.cwd(), 'data', 'global_airports_database.csv');
      
      if (!fs.existsSync(csvPath)) {
        console.log('Global airports database not found, creating from attached file...');
        return;
      }

      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');

      console.log(`Loading global airports database with ${lines.length - 1} airports...`);

      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;

        const values = this.parseCSVLine(lines[i]);
        if (values.length < headers.length) continue;

        const airport: GlobalAirport = {
          id: values[0],
          ident: values[1],
          type: values[2] as any,
          name: values[3],
          latitude_deg: parseFloat(values[4]) || 0,
          longitude_deg: parseFloat(values[5]) || 0,
          elevation_ft: parseFloat(values[6]) || 0,
          continent: values[7],
          iso_country: values[8],
          iso_region: values[9],
          municipality: values[10],
          scheduled_service: values[11] as any,
          icao_code: values[12],
          iata_code: values[13],
          gps_code: values[14],
          local_code: values[15],
          home_link: values[16],
          wikipedia_link: values[17],
          keywords: values[18],
          runway_lighted: values[19] === '1',
          faa_locid: values[20],
          faa_airport_name: values[21],
          faa_class: values[22],
          arff_index: values[23]
        };

        this.airports.push(airport);

        // Build indexes
        if (airport.icao_code) {
          this.airportsByICAO.set(airport.icao_code, airport);
        }
        if (airport.iata_code) {
          this.airportsByIATA.set(airport.iata_code, airport);
        }

        // Country index
        if (!this.airportsByCountry.has(airport.iso_country)) {
          this.airportsByCountry.set(airport.iso_country, []);
        }
        this.airportsByCountry.get(airport.iso_country)!.push(airport);
      }

      this.loaded = true;
      console.log(`✅ Global Airport Service: Loaded ${this.airports.length} airports`);
      console.log(`   - ICAO codes: ${this.airportsByICAO.size}`);
      console.log(`   - IATA codes: ${this.airportsByIATA.size}`);
      console.log(`   - Countries: ${this.airportsByCountry.size}`);

    } catch (error) {
      console.error('Error loading global airports database:', error);
    }
  }

  private parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  public getAirportByICAO(icao: string): GlobalAirport | undefined {
    return this.airportsByICAO.get(icao.toUpperCase());
  }

  public getAirportByIATA(iata: string): GlobalAirport | undefined {
    return this.airportsByIATA.get(iata.toUpperCase());
  }

  public getAirportsByCountry(countryCode: string): GlobalAirport[] {
    return this.airportsByCountry.get(countryCode.toUpperCase()) || [];
  }

  public searchAirports(filter: AirportFilter, limit = 100): GlobalAirport[] {
    let results = this.airports;

    // Apply filters
    if (filter.country) {
      results = results.filter(a => a.iso_country === filter.country!.toUpperCase());
    }

    if (filter.continent) {
      results = results.filter(a => a.continent === filter.continent);
    }

    if (filter.type && filter.type.length > 0) {
      results = results.filter(a => filter.type!.includes(a.type));
    }

    if (filter.scheduledService !== undefined) {
      const service = filter.scheduledService ? 'yes' : 'no';
      results = results.filter(a => a.scheduled_service === service);
    }

    if (filter.hasICAO) {
      results = results.filter(a => a.icao_code && a.icao_code.length > 0);
    }

    if (filter.hasIATA) {
      results = results.filter(a => a.iata_code && a.iata_code.length > 0);
    }

    if (filter.region) {
      results = results.filter(a => a.iso_region === filter.region);
    }

    // Geographic bounds
    if (filter.minLat !== undefined) {
      results = results.filter(a => a.latitude_deg >= filter.minLat!);
    }
    if (filter.maxLat !== undefined) {
      results = results.filter(a => a.latitude_deg <= filter.maxLat!);
    }
    if (filter.minLon !== undefined) {
      results = results.filter(a => a.longitude_deg >= filter.minLon!);
    }
    if (filter.maxLon !== undefined) {
      results = results.filter(a => a.longitude_deg <= filter.maxLon!);
    }

    // Radius search
    if (filter.nearPoint) {
      const { lat, lon, radiusKm } = filter.nearPoint;
      results = results.filter(airport => {
        const distance = this.calculateDistance(lat, lon, airport.latitude_deg, airport.longitude_deg);
        return distance <= radiusKm;
      });
    }

    return results.slice(0, limit);
  }

  public getMajorAirports(country?: string): GlobalAirport[] {
    const filter: AirportFilter = {
      type: ['large_airport', 'medium_airport'],
      scheduledService: true,
      hasICAO: true,
      hasIATA: true
    };

    if (country) {
      filter.country = country;
    }

    return this.searchAirports(filter, 200);
  }

  public getAirportsNearLocation(lat: number, lon: number, radiusKm = 100, includeHeliports = false): GlobalAirport[] {
    const types = includeHeliports 
      ? ['large_airport', 'medium_airport', 'small_airport', 'heliport']
      : ['large_airport', 'medium_airport', 'small_airport'];

    return this.searchAirports({
      nearPoint: { lat, lon, radiusKm },
      type: types
    }, 50);
  }

  public getAirportStatistics(): any {
    if (!this.loaded) return null;

    const stats = {
      total: this.airports.length,
      byType: {} as Record<string, number>,
      byContinent: {} as Record<string, number>,
      byCountry: {} as Record<string, number>,
      withScheduledService: 0,
      withICAO: this.airportsByICAO.size,
      withIATA: this.airportsByIATA.size,
      runwayLighted: 0
    };

    this.airports.forEach(airport => {
      // By type
      stats.byType[airport.type] = (stats.byType[airport.type] || 0) + 1;

      // By continent
      if (airport.continent) {
        stats.byContinent[airport.continent] = (stats.byContinent[airport.continent] || 0) + 1;
      }

      // By country
      stats.byCountry[airport.iso_country] = (stats.byCountry[airport.iso_country] || 0) + 1;

      // Services
      if (airport.scheduled_service === 'yes') {
        stats.withScheduledService++;
      }

      if (airport.runway_lighted) {
        stats.runwayLighted++;
      }
    });

    return stats;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = this.toRadians(lat2 - lat1);
    const dLon = this.toRadians(lon2 - lon1);
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  public isLoaded(): boolean {
    return this.loaded;
  }
}

export const globalAirportService = new GlobalAirportService();
export { GlobalAirport, AirportFilter };