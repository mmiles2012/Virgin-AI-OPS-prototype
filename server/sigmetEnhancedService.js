/**
 * Enhanced SIGMET Service for AINO Aviation Platform
 * Integrates AWC SIGMET data with Virgin Atlantic flight monitoring
 */

import axios from 'axios';
import fs from 'fs/promises';
import path from 'path';

class SigmetEnhancedService {
  constructor() {
    this.cache = null;
    this.cacheTimeout = 15 * 60 * 1000; // 15 minutes
    this.lastFetch = 0;
    this.sigmetFilePath = path.join(process.cwd(), 'data', 'sigmets.geojson');
  }

  /**
   * Fetch SIGMET data from Aviation Weather Center
   */
  async fetchSigmetData() {
    const now = Date.now();
    
    // Return cached data if still fresh
    if (this.cache && (now - this.lastFetch) < this.cacheTimeout) {
      return this.cache;
    }

    try {
      console.log('🌩️ Fetching fresh SIGMET data from Aviation Weather Center...');
      
      const response = await axios.get(
        'https://www.aviationweather.gov/api/data/metproducts',
        {
          params: {
            format: 'geojson',
            product: 'sigmet'
          },
          timeout: 10000
        }
      );

      if (response.status === 200 && response.data) {
        this.cache = response.data;
        this.lastFetch = now;
        
        // Save to file for persistence
        await this.saveSigmetData(response.data);
        
        console.log(`✅ SIGMET data updated: ${response.data.features?.length || 0} active SIGMETs`);
        return response.data;
      }
    } catch (error) {
      console.error('❌ Failed to fetch SIGMET data:', error.message);
      
      // Try to load from file as fallback
      try {
        const fileData = await fs.readFile(this.sigmetFilePath, 'utf8');
        const cachedData = JSON.parse(fileData);
        console.log('📁 Using cached SIGMET data from file');
        return cachedData;
      } catch (fileError) {
        console.error('❌ No cached SIGMET data available');
        return { type: 'FeatureCollection', features: [] };
      }
    }

    return { type: 'FeatureCollection', features: [] };
  }

  /**
   * Save SIGMET data to file
   */
  async saveSigmetData(data) {
    try {
      // Ensure data directory exists
      const dataDir = path.dirname(this.sigmetFilePath);
      await fs.mkdir(dataDir, { recursive: true });
      
      await fs.writeFile(this.sigmetFilePath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save SIGMET data:', error.message);
    }
  }

  /**
   * Check if aircraft coordinates are within any active SIGMET
   */
  isAircraftInSigmet(latitude, longitude, sigmetData) {
    if (!sigmetData || !sigmetData.features) {
      return { inSigmet: false, alerts: [] };
    }

    const alerts = [];
    
    for (const feature of sigmetData.features) {
      if (this.pointInPolygon(latitude, longitude, feature.geometry)) {
        alerts.push({
          type: 'SIGMET',
          hazard: feature.properties.hazard || 'Unknown hazard',
          severity: feature.properties.severity || 'MODERATE',
          description: feature.properties.description || 'Significant meteorological condition',
          validFrom: feature.properties.validTimeFrom,
          validTo: feature.properties.validTimeTo,
          area: feature.properties.area
        });
      }
    }

    return {
      inSigmet: alerts.length > 0,
      alerts: alerts
    };
  }

  /**
   * Point-in-polygon algorithm for SIGMET area checking
   */
  pointInPolygon(lat, lon, geometry) {
    if (!geometry || geometry.type !== 'Polygon') {
      return false;
    }

    const polygon = geometry.coordinates[0]; // First ring (exterior)
    let inside = false;

    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
      const xi = polygon[i][1], yi = polygon[i][0]; // [lon, lat] format
      const xj = polygon[j][1], yj = polygon[j][0];

      if (((yi > lat) !== (yj > lat)) &&
          (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi)) {
        inside = !inside;
      }
    }

    return inside;
  }

  /**
   * Analyze Virgin Atlantic fleet for SIGMET exposure
   */
  async analyzeFleetSigmetExposure(virginAtlanticFlights) {
    const sigmetData = await this.fetchSigmetData();
    const analysis = {
      totalFlights: virginAtlanticFlights.length,
      flightsInSigmet: 0,
      alerts: [],
      sigmetCount: sigmetData.features?.length || 0,
      analysis_time: new Date().toISOString()
    };

    for (const flight of virginAtlanticFlights) {
      if (flight.latitude && flight.longitude) {
        const sigmetCheck = this.isAircraftInSigmet(
          flight.latitude, 
          flight.longitude, 
          sigmetData
        );

        if (sigmetCheck.inSigmet) {
          analysis.flightsInSigmet++;
          analysis.alerts.push({
            flight_number: flight.flight_number,
            callsign: flight.callsign,
            route: flight.route,
            position: {
              latitude: flight.latitude,
              longitude: flight.longitude,
              altitude: flight.altitude
            },
            sigmet_alerts: sigmetCheck.alerts
          });
        }
      }
    }

    return analysis;
  }

  /**
   * Get operational SIGMET summary for operations center
   */
  async getOperationalSummary() {
    const sigmetData = await this.fetchSigmetData();
    
    const summary = {
      active_sigmets: sigmetData.features?.length || 0,
      hazard_types: {},
      severity_breakdown: { HIGH: 0, MODERATE: 0, LOW: 0 },
      geographical_areas: [],
      operational_impact: 'MINIMAL',
      last_updated: new Date().toISOString()
    };

    if (sigmetData.features) {
      for (const feature of sigmetData.features) {
        const hazard = feature.properties.hazard || 'Unknown';
        const severity = feature.properties.severity || 'MODERATE';
        const area = feature.properties.area || 'Unspecified';

        // Count hazard types
        summary.hazard_types[hazard] = (summary.hazard_types[hazard] || 0) + 1;
        
        // Count severity levels
        summary.severity_breakdown[severity] = (summary.severity_breakdown[severity] || 0) + 1;
        
        // Collect geographical areas
        if (!summary.geographical_areas.includes(area)) {
          summary.geographical_areas.push(area);
        }
      }

      // Determine operational impact
      if (summary.severity_breakdown.HIGH > 0) {
        summary.operational_impact = 'SIGNIFICANT';
      } else if (summary.severity_breakdown.MODERATE > 2) {
        summary.operational_impact = 'MODERATE';
      }
    }

    return summary;
  }
}

export default new SigmetEnhancedService();