/**
 * AWC SIGMET Service for AINO Aviation Intelligence Platform
 * Integrates official Aviation Weather Center SIGMET data
 */

import axios from 'axios';

interface SigmetData {
  id: string;
  validTime: string;
  issuingOffice: string;
  phenomenon: string;
  severity: string;
  altitude: {
    lower: number;
    upper: number;
  };
  coordinates: Array<{
    lat: number;
    lon: number;
  }>;
  rawText: string;
  effectiveStart: string;
  effectiveEnd: string;
  movement?: {
    direction: number;
    speed: number;
  };
}

interface ProcessedSigmet {
  alert_type: string;
  id: string;
  location: string;
  description: string;
  effective_start: string;
  effective_end: string;
  severity: string;
  source: string;
  raw_data: string;
  scraped_at: string;
  coordinates?: {
    lat: number;
    lon: number;
  } | null;
  altitude_range?: {
    lower: number;
    upper: number;
  };
  phenomenon: string;
  movement?: {
    direction: number;
    speed: number;
  };
}

class AWCSigmetService {
  private baseURL = 'https://aviationweather.gov/api/data';
  private headers = {
    'User-Agent': 'AINO-Aviation-Platform/1.0 (Professional Aviation Operations)',
    'Accept': 'application/json, text/plain',
  };
  private requestDelay = 1000; // 1 second between requests
  private cachedSigmets: ProcessedSigmet[] = [];
  private lastUpdate: Date | null = null;
  private updateInterval = 15 * 60 * 1000; // 15 minutes

  constructor() {
    this.startPeriodicUpdates();
  }

  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private mapSeverityLevel(phenomenon: string, rawText: string): string {
    const text = rawText.toUpperCase();
    
    if (text.includes('SEVERE') || text.includes('EXTREME') || phenomenon.includes('TORNADO')) {
      return 'CRITICAL';
    } else if (text.includes('MODERATE') || phenomenon.includes('THUNDERSTORM') || phenomenon.includes('TURBULENCE')) {
      return 'HIGH';
    } else if (text.includes('LIGHT') || phenomenon.includes('ICING')) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  private extractCoordinates(rawText: string): Array<{ lat: number; lon: number }> {
    // Extract coordinates from SIGMET text format
    const coordPattern = /(\d{2,3})(\d{2})([NS])\s*(\d{2,3})(\d{2})([EW])/g;
    const coordinates: Array<{ lat: number; lon: number }> = [];
    
    let match;
    while ((match = coordPattern.exec(rawText)) !== null) {
      const latDeg = parseInt(match[1]);
      const latMin = parseInt(match[2]);
      const latDir = match[3];
      const lonDeg = parseInt(match[4]);
      const lonMin = parseInt(match[5]);
      const lonDir = match[6];
      
      let lat = latDeg + latMin / 60;
      let lon = lonDeg + lonMin / 60;
      
      if (latDir === 'S') lat = -lat;
      if (lonDir === 'W') lon = -lon;
      
      coordinates.push({ lat, lon });
    }
    
    return coordinates;
  }

  private extractAltitudeRange(rawText: string): { lower: number; upper: number } | undefined {
    // Extract altitude information from SIGMET text
    const altPattern = /(?:FL|FLIGHT LEVEL)\s*(\d{3})\s*(?:TO|-)?\s*(?:FL|FLIGHT LEVEL)?\s*(\d{3})?/i;
    const match = rawText.match(altPattern);
    
    if (match) {
      const lower = parseInt(match[1]) * 100; // FL to feet
      const upper = match[2] ? parseInt(match[2]) * 100 : lower + 10000; // Default 10k ft range
      return { lower, upper };
    }
    
    // Check for surface level references
    if (rawText.includes('SFC') || rawText.includes('SURFACE')) {
      return { lower: 0, upper: 10000 };
    }
    
    return undefined;
  }

  private extractMovement(rawText: string): { direction: number; speed: number } | undefined {
    // Extract movement information
    const movementPattern = /MOV\s*([NSEW]{1,2})\s*(\d{1,3})\s*KT/i;
    const match = rawText.match(movementPattern);
    
    if (match) {
      const dirStr = match[1];
      const speed = parseInt(match[2]);
      
      // Convert direction string to degrees
      const dirMap: { [key: string]: number } = {
        'N': 0, 'NE': 45, 'E': 90, 'SE': 135,
        'S': 180, 'SW': 225, 'W': 270, 'NW': 315
      };
      
      const direction = dirMap[dirStr] || 0;
      return { direction, speed };
    }
    
    return undefined;
  }

  private processSigmetData(rawSigmets: any[]): ProcessedSigmet[] {
    return rawSigmets.map((sigmet, index) => {
      const coordinates = this.extractCoordinates(sigmet.rawText || '');
      const centerCoord = coordinates.length > 0 ? 
        coordinates.reduce((sum, coord) => ({
          lat: sum.lat + coord.lat,
          lon: sum.lon + coord.lon
        }), { lat: 0, lon: 0 }) : null;

      if (centerCoord && coordinates.length > 0) {
        centerCoord.lat /= coordinates.length;
        centerCoord.lon /= coordinates.length;
      }

      const phenomenon = sigmet.hazard || sigmet.phenomenon || 'UNKNOWN';
      const severity = this.mapSeverityLevel(phenomenon, sigmet.rawText || '');
      
      return {
        alert_type: 'SIGMET',
        id: `SIGMET-${sigmet.id || index}-${Date.now()}`,
        location: sigmet.issuingOffice || 'UNKNOWN',
        description: `${phenomenon}: ${sigmet.rawText || 'No description available'}`,
        effective_start: sigmet.validTimeFrom || new Date().toISOString(),
        effective_end: sigmet.validTimeTo || new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(), // 6 hours default
        severity,
        source: 'AWC SIGMET API',
        raw_data: sigmet.rawText || JSON.stringify(sigmet),
        scraped_at: new Date().toISOString(),
        coordinates: centerCoord || undefined,
        altitude_range: this.extractAltitudeRange(sigmet.rawText || ''),
        phenomenon,
        movement: this.extractMovement(sigmet.rawText || '')
      };
    });
  }

  async fetchCurrentSigmets(): Promise<ProcessedSigmet[]> {
    try {
      console.log('Fetching current SIGMETs from AWC API...');
      
      const response = await axios.get(`${this.baseURL}/sigmets`, {
        params: {
          format: 'json'
        },
        headers: this.headers,
        timeout: 15000
      });

      const sigmetData = Array.isArray(response.data) ? response.data : [];
      const processedSigmets = this.processSigmetData(sigmetData);
      
      this.cachedSigmets = processedSigmets;
      this.lastUpdate = new Date();
      
      console.log(`Successfully processed ${processedSigmets.length} SIGMETs`);
      return processedSigmets;

    } catch (error) {
      console.error('Error fetching SIGMET data from AWC:', error);
      
      // Return cached data if available
      if (this.cachedSigmets.length > 0) {
        console.log('Returning cached SIGMET data');
        return this.cachedSigmets;
      }
      
      return [];
    }
  }

  async fetchRegionalSigmets(bbox: string): Promise<ProcessedSigmet[]> {
    try {
      console.log(`Fetching regional SIGMETs for bbox: ${bbox}`);
      
      const response = await axios.get(`${this.baseURL}/sigmets`, {
        params: {
          format: 'json',
          bbox: bbox // lat1,lon1,lat2,lon2
        },
        headers: this.headers,
        timeout: 15000
      });

      const sigmetData = Array.isArray(response.data) ? response.data : [];
      return this.processSigmetData(sigmetData);

    } catch (error) {
      console.error('Error fetching regional SIGMET data:', error);
      return [];
    }
  }

  async fetchGAirmets(): Promise<ProcessedSigmet[]> {
    try {
      console.log('Fetching G-AIRMETs from AWC API...');
      
      const response = await axios.get(`${this.baseURL}/gairmets`, {
        params: {
          format: 'json'
        },
        headers: this.headers,
        timeout: 15000
      });

      const gairmetData = Array.isArray(response.data) ? response.data : [];
      
      // Process G-AIRMETs similar to SIGMETs but with different alert type
      const processedGAirmets = gairmetData.map((gairmet, index) => {
        const coordinates = this.extractCoordinates(gairmet.rawText || '');
        const centerCoord = coordinates.length > 0 ? 
          coordinates.reduce((sum, coord) => ({
            lat: sum.lat + coord.lat,
            lon: sum.lon + coord.lon
          }), { lat: 0, lon: 0 }) : null;

        if (centerCoord && coordinates.length > 0) {
          centerCoord.lat /= coordinates.length;
          centerCoord.lon /= coordinates.length;
        }

        const phenomenon = gairmet.hazard || gairmet.phenomenon || 'UNKNOWN';
        
        return {
          alert_type: 'G-AIRMET',
          id: `GAIRMET-${gairmet.id || index}-${Date.now()}`,
          location: gairmet.issuingOffice || 'UNKNOWN',
          description: `${phenomenon}: ${gairmet.rawText || 'No description available'}`,
          effective_start: gairmet.validTimeFrom || new Date().toISOString(),
          effective_end: gairmet.validTimeTo || new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
          severity: this.mapSeverityLevel(phenomenon, gairmet.rawText || ''),
          source: 'AWC G-AIRMET API',
          raw_data: gairmet.rawText || JSON.stringify(gairmet),
          scraped_at: new Date().toISOString(),
          coordinates: centerCoord || undefined,
          altitude_range: this.extractAltitudeRange(gairmet.rawText || ''),
          phenomenon,
          movement: this.extractMovement(gairmet.rawText || '')
        };
      });

      console.log(`Successfully processed ${processedGAirmets.length} G-AIRMETs`);
      return processedGAirmets;

    } catch (error) {
      console.error('Error fetching G-AIRMET data:', error);
      return [];
    }
  }

  async getAllWeatherAlerts(): Promise<ProcessedSigmet[]> {
    try {
      const [sigmets, gairmets] = await Promise.all([
        this.fetchCurrentSigmets(),
        this.fetchGAirmets()
      ]);

      await this.delay(this.requestDelay);
      
      const allAlerts = [...sigmets, ...gairmets];
      console.log(`Total weather alerts: ${allAlerts.length} (${sigmets.length} SIGMETs, ${gairmets.length} G-AIRMETs)`);
      
      return allAlerts;

    } catch (error) {
      console.error('Error fetching all weather alerts:', error);
      return this.cachedSigmets; // Return cached data as fallback
    }
  }

  getCachedSigmets(): ProcessedSigmet[] {
    return this.cachedSigmets;
  }

  getLastUpdateTime(): Date | null {
    return this.lastUpdate;
  }

  private startPeriodicUpdates(): void {
    console.log('Starting periodic SIGMET updates (every 15 minutes)');
    
    // Initial fetch
    this.fetchCurrentSigmets().catch(console.error);
    
    // Set up periodic updates
    setInterval(() => {
      this.fetchCurrentSigmets().catch(console.error);
    }, this.updateInterval);
  }

  async getAlertsForAPI(): Promise<{
    success: boolean;
    alerts: ProcessedSigmet[];
    lastUpdate: string | null;
    source: string;
    count: number;
  }> {
    try {
      const alerts = await this.getAllWeatherAlerts();
      
      return {
        success: true,
        alerts,
        lastUpdate: this.lastUpdate?.toISOString() || null,
        source: 'AWC Official Data API',
        count: alerts.length
      };
    } catch (error) {
      console.error('Error in getAlertsForAPI:', error);
      return {
        success: false,
        alerts: this.cachedSigmets,
        lastUpdate: this.lastUpdate?.toISOString() || null,
        source: 'AWC Official Data API (Cached)',
        count: this.cachedSigmets.length
      };
    }
  }
}

// Export singleton instance
export const awcSigmetService = new AWCSigmetService();
export default awcSigmetService;