/**
 * Enhanced Airport Service for AINO Aviation Intelligence Platform
 * Integrates with Python scraper for comprehensive facility data
 */

import { spawn } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

interface FacilityData {
  icao: string;
  airport_name: string;
  is_virgin_atlantic_hub: boolean;
  services: {
    ground_handlers: string[];
    maintenance_providers: string[];
    fuel_suppliers: string[];
  };
  contact_info: {
    emails?: string[];
    phones?: string[];
  };
  data_source: string;
  last_updated: string;
}

interface FacilityReport {
  generated_at: string;
  total_airports: number;
  virgin_atlantic_hubs: number;
  facilities_summary: {
    ground_handlers_identified: number;
    maintenance_providers_identified: number;
    fuel_suppliers_identified: number;
    contact_info_available: number;
  };
  airports: FacilityData[];
}

class EnhancedAirportService {
  private facilityDataPath = 'airport_facility_data/aino_airport_facilities.json';
  private lastScrapingTime: Date | null = null;
  private cachedData: FacilityReport | null = null;

  constructor() {
    this.loadCachedData();
  }

  private loadCachedData(): void {
    try {
      if (fs.existsSync(this.facilityDataPath)) {
        const rawData = fs.readFileSync(this.facilityDataPath, 'utf8');
        this.cachedData = JSON.parse(rawData);
        this.lastScrapingTime = new Date(this.cachedData?.generated_at || Date.now());
        console.log(`Loaded facility data for ${this.cachedData?.total_airports || 0} airports`);
      }
    } catch (error) {
      console.error('Error loading cached facility data:', error);
    }
  }

  public async runEnhancedScraping(maxAirports: number = 25): Promise<FacilityReport | null> {
    return new Promise((resolve, reject) => {
      console.log('Starting enhanced airport facility scraping...');
      
      const pythonProcess = spawn('python3', [
        'enhanced_airport_facility_scraper.py'
      ], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let stdout = '';
      let stderr = '';

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString();
        console.log(`Scraper: ${data.toString().trim()}`);
      });

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString();
        console.error(`Scraper Error: ${data.toString().trim()}`);
      });

      pythonProcess.on('close', (code) => {
        if (code === 0) {
          console.log('Enhanced scraping completed successfully');
          this.loadCachedData();
          resolve(this.cachedData);
        } else {
          console.error(`Enhanced scraping failed with code ${code}`);
          console.error('STDERR:', stderr);
          reject(new Error(`Scraping process failed with code ${code}`));
        }
      });

      pythonProcess.on('error', (error) => {
        console.error('Failed to start scraping process:', error);
        reject(error);
      });

      // Set timeout for scraping process
      setTimeout(() => {
        pythonProcess.kill();
        reject(new Error('Scraping process timed out'));
      }, 300000); // 5 minutes timeout
    });
  }

  public getFacilityData(): FacilityReport | null {
    return this.cachedData;
  }

  public getVirginAtlanticHubs(): FacilityData[] {
    if (!this.cachedData) return [];
    
    return this.cachedData.airports.filter(airport => airport.is_virgin_atlantic_hub);
  }

  public getAirportByICAO(icao: string): FacilityData | null {
    if (!this.cachedData) return null;
    
    return this.cachedData.airports.find(airport => airport.icao === icao) || null;
  }

  public getServiceProviders(serviceType: 'ground_handlers' | 'maintenance_providers' | 'fuel_suppliers'): Array<{airport: string, providers: string[]}> {
    if (!this.cachedData) return [];
    
    return this.cachedData.airports
      .filter(airport => airport.services[serviceType].length > 0)
      .map(airport => ({
        airport: airport.icao,
        providers: airport.services[serviceType]
      }));
  }

  public getContactInfo(icao: string): {emails: string[], phones: string[]} | null {
    const airport = this.getAirportByICAO(icao);
    if (!airport || !airport.contact_info) return null;
    
    return {
      emails: airport.contact_info.emails || [],
      phones: airport.contact_info.phones || []
    };
  }

  public shouldUpdateData(): boolean {
    if (!this.lastScrapingTime) return true;
    
    const hoursSinceLastUpdate = (Date.now() - this.lastScrapingTime.getTime()) / (1000 * 60 * 60);
    return hoursSinceLastUpdate > 24; // Update daily
  }

  public getFacilityStatistics(): {
    total_airports: number;
    virgin_atlantic_coverage: number;
    service_coverage: {
      ground_handling: number;
      maintenance: number;
      fuel_supply: number;
      contact_available: number;
    };
    data_freshness: {
      last_updated: string;
      hours_old: number;
    };
  } {
    if (!this.cachedData) {
      return {
        total_airports: 0,
        virgin_atlantic_coverage: 0,
        service_coverage: {
          ground_handling: 0,
          maintenance: 0,
          fuel_supply: 0,
          contact_available: 0
        },
        data_freshness: {
          last_updated: 'Never',
          hours_old: -1
        }
      };
    }

    const hoursOld = this.lastScrapingTime 
      ? (Date.now() - this.lastScrapingTime.getTime()) / (1000 * 60 * 60)
      : -1;

    return {
      total_airports: this.cachedData.total_airports,
      virgin_atlantic_coverage: this.cachedData.virgin_atlantic_hubs,
      service_coverage: {
        ground_handling: this.cachedData.facilities_summary.ground_handlers_identified,
        maintenance: this.cachedData.facilities_summary.maintenance_providers_identified,
        fuel_supply: this.cachedData.facilities_summary.fuel_suppliers_identified,
        contact_available: this.cachedData.facilities_summary.contact_info_available
      },
      data_freshness: {
        last_updated: this.lastScrapingTime?.toISOString() || 'Never',
        hours_old: Math.round(hoursOld * 10) / 10
      }
    };
  }

  public async refreshFacilityData(): Promise<boolean> {
    try {
      const result = await this.runEnhancedScraping();
      return result !== null;
    } catch (error) {
      console.error('Failed to refresh facility data:', error);
      return false;
    }
  }
}

export const enhancedAirportService = new EnhancedAirportService();