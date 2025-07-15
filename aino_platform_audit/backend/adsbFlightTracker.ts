import axios from 'axios';

export interface ADSBFlightData {
  icao24: string;
  callsign: string;
  origin_country: string;
  time_position: number;
  last_contact: number;
  longitude: number;
  latitude: number;
  baro_altitude: number;
  on_ground: boolean;
  velocity: number;
  true_track: number;
  vertical_rate: number;
  sensors: number[];
  geo_altitude: number;
  squawk: string;
  spi: boolean;
  position_source: number;
  category: number;
}

export interface ADSBTrackingResponse {
  success: boolean;
  aircraft: ADSBFlightData[];
  count: number;
  timestamp: string;
  data_source: string;
  coverage_area?: {
    bounds: {
      min_latitude: number;
      max_latitude: number;
      min_longitude: number;
      max_longitude: number;
    };
  };
}

class ADSBFlightTracker {
  private openSkyBaseUrl = 'https://opensky-network.org/api';
  private adsbExchangeBaseUrl = 'https://adsbexchange-com1.p.rapidapi.com/v2';
  
  constructor() {
    console.log('ADS-B Flight Tracker initialized');
  }

  /**
   * Get real-time ADS-B data from OpenSky Network
   */
  async getOpenSkyADSBData(bounds?: {
    min_latitude: number;
    max_latitude: number;
    min_longitude: number;
    max_longitude: number;
  }): Promise<ADSBTrackingResponse> {
    try {
      let url = `${this.openSkyBaseUrl}/states/all`;
      
      if (bounds) {
        const params = new URLSearchParams({
          lamin: bounds.min_latitude.toString(),
          lamax: bounds.max_latitude.toString(),
          lomin: bounds.min_longitude.toString(),
          lomax: bounds.max_longitude.toString()
        });
        url += `?${params}`;
      }

      const config: any = {
        timeout: 15000,
        headers: {
          'User-Agent': 'AINO-Aviation-Intelligence-Platform/1.0'
        }
      };

      // Add authentication if available
      if (process.env.OPENSKY_USERNAME && process.env.OPENSKY_PASSWORD) {
        config.auth = {
          username: process.env.OPENSKY_USERNAME,
          password: process.env.OPENSKY_PASSWORD
        };
      }

      const response = await axios.get(url, config);
      
      if (response.data && response.data.states) {
        const aircraft: ADSBFlightData[] = response.data.states
          .filter((state: any[]) => state[6] !== null && state[5] !== null) // Has valid coordinates
          .map((state: any[]) => ({
            icao24: state[0],
            callsign: state[1]?.trim() || state[0],
            origin_country: state[2],
            time_position: state[3],
            last_contact: state[4],
            longitude: state[5],
            latitude: state[6],
            baro_altitude: state[7],
            on_ground: state[8],
            velocity: state[9],
            true_track: state[10],
            vertical_rate: state[11],
            sensors: state[12] || [],
            geo_altitude: state[13],
            squawk: state[14],
            spi: state[15],
            position_source: state[16],
            category: state[17] || 0
          }));

        return {
          success: true,
          aircraft,
          count: aircraft.length,
          timestamp: new Date().toISOString(),
          data_source: 'OpenSky_Network_ADS-B',
          coverage_area: bounds ? { bounds } : undefined
        };
      }

      return {
        success: false,
        aircraft: [],
        count: 0,
        timestamp: new Date().toISOString(),
        data_source: 'OpenSky_Network_ADS-B'
      };

    } catch (error: any) {
      console.error('OpenSky ADS-B data fetch error:', error.message);
      throw new Error(`OpenSky ADS-B data unavailable: ${error.message}`);
    }
  }

  /**
   * Get specific aircraft ADS-B data by ICAO address
   */
  async getAircraftADSBData(icao24: string): Promise<ADSBFlightData | null> {
    try {
      const url = `${this.openSkyBaseUrl}/states/all?icao24=${icao24}`;
      
      const config: any = {
        timeout: 10000,
        headers: {
          'User-Agent': 'AINO-Aviation-Intelligence-Platform/1.0'
        }
      };

      if (process.env.OPENSKY_USERNAME && process.env.OPENSKY_PASSWORD) {
        config.auth = {
          username: process.env.OPENSKY_USERNAME,
          password: process.env.OPENSKY_PASSWORD
        };
      }

      const response = await axios.get(url, config);
      
      if (response.data && response.data.states && response.data.states.length > 0) {
        const state = response.data.states[0];
        return {
          icao24: state[0],
          callsign: state[1]?.trim() || state[0],
          origin_country: state[2],
          time_position: state[3],
          last_contact: state[4],
          longitude: state[5],
          latitude: state[6],
          baro_altitude: state[7],
          on_ground: state[8],
          velocity: state[9],
          true_track: state[10],
          vertical_rate: state[11],
          sensors: state[12] || [],
          geo_altitude: state[13],
          squawk: state[14],
          spi: state[15],
          position_source: state[16],
          category: state[17] || 0
        };
      }

      return null;
    } catch (error: any) {
      console.error(`Error fetching ADS-B data for ${icao24}:`, error.message);
      return null;
    }
  }

  /**
   * Get Virgin Atlantic fleet ADS-B data specifically
   */
  async getVirginAtlanticADSBData(): Promise<ADSBTrackingResponse> {
    try {
      // Virgin Atlantic ICAO codes start with G-V
      const virginAtlanticICAOs = [
        'G-VLIB', 'G-VLIP', 'G-VMAP', 'G-VMIK', 'G-VMNK',
        'G-VPOP', 'G-VRAY', 'G-VROC', 'G-VROY', 'G-VTEA',
        'G-VWAG', 'G-VWIN', 'G-VYOU'
      ];

      const aircraftData: ADSBFlightData[] = [];
      
      for (const icao of virginAtlanticICAOs) {
        try {
          const data = await this.getAircraftADSBData(icao.toLowerCase());
          if (data) {
            aircraftData.push(data);
          }
        } catch (error) {
          // Continue with other aircraft if one fails
          continue;
        }
      }

      return {
        success: true,
        aircraft: aircraftData,
        count: aircraftData.length,
        timestamp: new Date().toISOString(),
        data_source: 'OpenSky_Network_Virgin_Atlantic_ADS-B'
      };

    } catch (error: any) {
      console.error('Virgin Atlantic ADS-B data fetch error:', error.message);
      return {
        success: false,
        aircraft: [],
        count: 0,
        timestamp: new Date().toISOString(),
        data_source: 'OpenSky_Network_Virgin_Atlantic_ADS-B'
      };
    }
  }

  /**
   * Format ADS-B data for display in operational dashboards
   */
  formatADSBForDisplay(aircraft: ADSBFlightData[]): any[] {
    return aircraft.map(ac => ({
      callsign: ac.callsign,
      icao24: ac.icao24.toUpperCase(),
      position: {
        latitude: ac.latitude,
        longitude: ac.longitude,
        altitude_ft: ac.baro_altitude ? Math.round(ac.baro_altitude * 3.28084) : 0,
        geo_altitude_ft: ac.geo_altitude ? Math.round(ac.geo_altitude * 3.28084) : 0
      },
      velocity: {
        ground_speed_kts: ac.velocity ? Math.round(ac.velocity * 1.94384) : 0,
        track_deg: ac.true_track || 0,
        vertical_rate_fpm: ac.vertical_rate ? Math.round(ac.vertical_rate * 196.85) : 0
      },
      status: {
        on_ground: ac.on_ground,
        squawk: ac.squawk,
        spi: ac.spi,
        last_contact_ago_sec: ac.last_contact ? Math.round(Date.now() / 1000 - ac.last_contact) : null
      },
      origin_country: ac.origin_country,
      position_source: ac.position_source,
      category: ac.category,
      timestamp: new Date().toISOString()
    }));
  }

  /**
   * Check ADS-B data quality and coverage
   */
  async checkADSBDataQuality(): Promise<{
    quality_score: number;
    coverage_assessment: string;
    active_aircraft_count: number;
    data_freshness_sec: number;
    recommendations: string[];
  }> {
    try {
      const ukBounds = {
        min_latitude: 49.9,
        max_latitude: 58.7,
        min_longitude: -8.0,
        max_longitude: 1.8
      };

      const adsbData = await this.getOpenSkyADSBData(ukBounds);
      
      if (!adsbData.success) {
        return {
          quality_score: 0,
          coverage_assessment: 'No ADS-B data available',
          active_aircraft_count: 0,
          data_freshness_sec: -1,
          recommendations: ['Check OpenSky Network connectivity', 'Verify API credentials']
        };
      }

      const now = Math.floor(Date.now() / 1000);
      const freshData = adsbData.aircraft.filter(ac => 
        ac.last_contact && (now - ac.last_contact) < 300 // Within last 5 minutes
      );

      const qualityScore = Math.min(100, (freshData.length / Math.max(adsbData.count, 1)) * 100);
      const avgDataAge = adsbData.aircraft.reduce((sum, ac) => 
        sum + (ac.last_contact ? now - ac.last_contact : 300), 0
      ) / Math.max(adsbData.aircraft.length, 1);

      const recommendations = [];
      if (qualityScore < 50) recommendations.push('Consider additional ADS-B data sources');
      if (avgDataAge > 180) recommendations.push('Data freshness could be improved');
      if (adsbData.count < 50) recommendations.push('Limited aircraft coverage in area');

      return {
        quality_score: Math.round(qualityScore),
        coverage_assessment: qualityScore > 80 ? 'Excellent' : qualityScore > 60 ? 'Good' : 'Limited',
        active_aircraft_count: freshData.length,
        data_freshness_sec: Math.round(avgDataAge),
        recommendations
      };

    } catch (error: any) {
      return {
        quality_score: 0,
        coverage_assessment: 'ADS-B service unavailable',
        active_aircraft_count: 0,
        data_freshness_sec: -1,
        recommendations: ['Check network connectivity', 'Verify ADS-B service status']
      };
    }
  }
}

export const adsbFlightTracker = new ADSBFlightTracker();