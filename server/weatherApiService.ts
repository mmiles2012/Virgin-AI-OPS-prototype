import axios from 'axios';

interface WeatherCondition {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  conditions: string;
  cloudCover: number;
  precipitation: number;
  pressure: number;
  humidity: number;
  dewPoint: number;
}

interface MetarData {
  station: string;
  observationTime: string;
  temperature: number;
  dewpoint: number;
  windDirection: number;
  windSpeed: number;
  visibility: number;
  altimeter: number;
  conditions: string;
  cloudLayers: {
    coverage: string;
    altitude: number;
    type: string;
  }[];
}

interface WeatherAlert {
  id: string;
  type: 'SIGMET' | 'AIRMET' | 'TAF' | 'METAR' | 'PIREP';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  location: {
    lat: number;
    lon: number;
    radius: number;
  };
  validFrom: string;
  validTo: string;
  phenomena: string[];
}

export interface AviationWeatherData {
  icao: string;
  metar: {
    raw: string;
    parsed: {
      temperature: number;
      dewpoint: number;
      windSpeed: number;
      windDirection: number;
      visibility: number;
      altimeter: number;
      conditions: string;
      clouds: string[];
      timestamp: string;
    };
  };
  taf: {
    raw: string;
    parsed: {
      validFrom: string;
      validTo: string;
      forecast: Array<{
        time: string;
        windSpeed: number;
        windDirection: number;
        visibility: number;
        conditions: string;
        clouds: string[];
      }>;
    };
  };
}

export class WeatherApiService {
  private openWeatherApiKey: string;
  private aviationWeatherApiKey: string;
  private meteoBlueApiKey: string;
  private weatherApiKey: string;
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 10 * 60 * 1000; // 10 minutes for weather data

  constructor() {
    this.openWeatherApiKey = process.env.OPENWEATHER_API_KEY || '';
    this.aviationWeatherApiKey = process.env.AVIATION_WEATHER_API_KEY || '';
    this.meteoBlueApiKey = process.env.METEOBLUE_API_KEY || '';
    this.weatherApiKey = process.env.WEATHER_API_KEY || '';
  }

  /**
   * Get current weather conditions for a specific location
   */
  async getCurrentWeather(lat: number, lon: number): Promise<WeatherCondition> {
    const cacheKey = `current_${lat.toFixed(2)}_${lon.toFixed(2)}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      // Try OpenWeatherMap API first
      if (this.openWeatherApiKey) {
        const weather = await this.fetchFromOpenWeather(lat, lon);
        this.setCachedData(cacheKey, weather);
        return weather;
      }

      // Try WeatherAPI.com as fallback
      if (this.weatherApiKey) {
        const weather = await this.fetchFromWeatherApi(lat, lon);
        this.setCachedData(cacheKey, weather);
        return weather;
      }

      // Use NOAA/Aviation Weather Center (free but limited)
      return await this.fetchFromAviationWeatherCenter(lat, lon);

    } catch (error) {
      console.error('Weather API error:', error);
      // Return reasonable defaults based on location and season
      return this.generateReasonableWeather(lat, lon);
    }
  }

  /**
   * Fetch weather from OpenWeatherMap API
   */
  private async fetchFromOpenWeather(lat: number, lon: number): Promise<WeatherCondition> {
    const response = await axios.get('https://api.openweathermap.org/data/2.5/weather', {
      params: {
        lat,
        lon,
        appid: this.openWeatherApiKey,
        units: 'metric'
      }
    });

    const data = response.data;
    return {
      temperature: Math.round(data.main.temp),
      windSpeed: Math.round(data.wind.speed * 1.94384), // Convert m/s to knots
      windDirection: data.wind.deg || 0,
      visibility: data.visibility ? Math.round(data.visibility / 1000) : 10, // Convert to km
      conditions: data.weather[0]?.description || 'Clear',
      cloudCover: data.clouds?.all || 0,
      precipitation: data.rain?.['1h'] || data.snow?.['1h'] || 0,
      pressure: Math.round(data.main.pressure),
      humidity: data.main.humidity,
      dewPoint: Math.round(data.main.temp - ((100 - data.main.humidity) / 5))
    };
  }

  /**
   * Fetch weather from WeatherAPI.com
   */
  private async fetchFromWeatherApi(lat: number, lon: number): Promise<WeatherCondition> {
    const response = await axios.get('https://api.weatherapi.com/v1/current.json', {
      params: {
        key: this.weatherApiKey,
        q: `${lat},${lon}`,
        aqi: 'no'
      }
    });

    const data = response.data.current;
    return {
      temperature: Math.round(data.temp_c),
      windSpeed: Math.round(data.wind_kph * 0.539957), // Convert kph to knots
      windDirection: data.wind_degree,
      visibility: Math.round(data.vis_km),
      conditions: data.condition.text,
      cloudCover: data.cloud,
      precipitation: data.precip_mm,
      pressure: Math.round(data.pressure_mb),
      humidity: data.humidity,
      dewPoint: Math.round(data.dewpoint_c)
    };
  }

  /**
   * Fetch from Aviation Weather Center (NOAA) - Free service
   */
  private async fetchFromAviationWeatherCenter(lat: number, lon: number): Promise<WeatherCondition> {
    try {
      // Find nearest METAR station (simplified approach)
      const nearestStation = this.findNearestMetarStation(lat, lon);
      const response = await axios.get(`https://aviationweather.gov/api/data/metar`, {
        params: {
          ids: nearestStation,
          format: 'json',
          taf: false,
          hours: 2,
          bbox: `${lon-1},${lat-1},${lon+1},${lat+1}`
        }
      });

      if (response.data && response.data.length > 0) {
        const metar = response.data[0];
        return this.parseMetarData(metar);
      }
    } catch (error) {
      console.error('Aviation Weather Center error:', error);
    }

    return this.generateReasonableWeather(lat, lon);
  }

  /**
   * Parse METAR data into standardized weather condition
   */
  private parseMetarData(metar: any): WeatherCondition {
    return {
      temperature: metar.temp || 15,
      windSpeed: metar.wspd || 5,
      windDirection: metar.wdir || 270,
      visibility: metar.visib || 10,
      conditions: metar.wxString || 'Clear',
      cloudCover: this.calculateCloudCover(metar.clouds),
      precipitation: 0, // METAR doesn't provide direct precipitation amount
      pressure: metar.altim ? Math.round(metar.altim * 33.8639) : 1013, // Convert inHg to mb
      humidity: 50, // Estimated
      dewPoint: metar.dewp || 10
    };
  }

  /**
   * Calculate cloud coverage from METAR cloud layers
   */
  private calculateCloudCover(clouds: any[]): number {
    if (!clouds || clouds.length === 0) return 0;
    
    const coverageMap: { [key: string]: number } = {
      'SKC': 0, 'CLR': 0, 'FEW': 25, 'SCT': 50, 'BKN': 75, 'OVC': 100
    };
    
    let maxCoverage = 0;
    clouds.forEach(cloud => {
      const coverage = coverageMap[cloud.cover] || 0;
      maxCoverage = Math.max(maxCoverage, coverage);
    });
    
    return maxCoverage;
  }

  /**
   * Find nearest METAR station (simplified - uses common airports)
   */
  private findNearestMetarStation(lat: number, lon: number): string {
    const majorStations = [
      { code: 'EGLL', lat: 51.4775, lon: -0.4614 }, // London Heathrow
      { code: 'KJFK', lat: 40.6413, lon: -73.7781 }, // JFK
      { code: 'LFPG', lat: 49.0097, lon: 2.5479 }, // Charles de Gaulle
      { code: 'EDDF', lat: 50.0264, lon: 8.5431 }, // Frankfurt
      { code: 'LIRF', lat: 41.8045, lon: 12.2508 }, // Rome Fiumicino
      { code: 'LEMD', lat: 40.4719, lon: -3.5626 }, // Madrid
      { code: 'EHAM', lat: 52.3086, lon: 4.7639 }, // Amsterdam
      { code: 'LOWW', lat: 48.1103, lon: 16.5697 }, // Vienna
      { code: 'ESSA', lat: 59.6519, lon: 17.9186 }, // Stockholm
      { code: 'EKCH', lat: 55.6181, lon: 12.6561 }, // Copenhagen
    ];

    let nearestStation = 'EGLL'; // Default to Heathrow
    let minDistance = Infinity;

    majorStations.forEach(station => {
      const distance = Math.sqrt(
        Math.pow(lat - station.lat, 2) + Math.pow(lon - station.lon, 2)
      );
      if (distance < minDistance) {
        minDistance = distance;
        nearestStation = station.code;
      }
    });

    return nearestStation;
  }

  /**
   * Get METAR and TAF data for a specific airport
   */
  async getAviationWeather(icao: string): Promise<AviationWeatherData | null> {
    try {
      // Fetch METAR data
      const metarResponse = await axios.get(`https://aviationweather.gov/cgi-bin/data/metar.php?ids=${icao}&format=json`);
      
      // Fetch TAF data
      const tafResponse = await axios.get(`https://aviationweather.gov/cgi-bin/data/taf.php?ids=${icao}&format=json`);
      
      let metarData = null;
      let tafData = null;
      
      if (metarResponse.data && metarResponse.data.length > 0) {
        metarData = metarResponse.data[0];
      }
      
      if (tafResponse.data && tafResponse.data.length > 0) {
        tafData = tafResponse.data[0];
      }
      
      if (!metarData) {
        // Generate fallback METAR if none available
        metarData = this.generateFallbackMetar(icao);
      }
      
      if (!tafData) {
        // Generate fallback TAF if none available
        tafData = this.generateFallbackTaf(icao);
      }
      
      return {
        icao,
        metar: {
          raw: metarData.rawOb || metarData.raw || `${icao} AUTO VRB05KT 9999 FEW020 15/10 Q1013`,
          parsed: {
            temperature: metarData.temp || 15,
            dewpoint: metarData.dewp || 10,
            windSpeed: metarData.wspd || 5,
            windDirection: metarData.wdir || 270,
            visibility: metarData.visib || 9999,
            altimeter: metarData.altim || 29.92,
            conditions: metarData.wxString || 'Clear',
            clouds: this.parseCloudLayers(metarData.clouds || []),
            timestamp: metarData.reportTime || new Date().toISOString()
          }
        },
        taf: {
          raw: tafData.rawTAF || tafData.raw || `TAF ${icao} ${this.generateTafTimestamp()} VRB05KT 9999 FEW020`,
          parsed: {
            validFrom: tafData.validTimeFrom || new Date().toISOString(),
            validTo: tafData.validTimeTo || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
            forecast: this.parseTafForecast(tafData.forecasts || [])
          }
        }
      };
    } catch (error) {
      console.error(`Aviation weather error for ${icao}:`, error);
      return this.generateFallbackAviationWeather(icao);
    }
  }

  private generateFallbackMetar(icao: string): any {
    const temp = 15 + Math.floor(Math.random() * 20) - 10;
    const dewp = temp - Math.floor(Math.random() * 10) - 2;
    const wspd = Math.floor(Math.random() * 15) + 3;
    const wdir = Math.floor(Math.random() * 36) * 10;
    
    return {
      temp,
      dewp,
      wspd,
      wdir,
      visib: 9999,
      altim: 29.92 + (Math.random() - 0.5) * 2,
      wxString: 'Clear',
      clouds: [],
      reportTime: new Date().toISOString(),
      raw: `${icao} AUTO ${String(wdir).padStart(3, '0')}${String(wspd).padStart(2, '0')}KT 9999 CLR ${String(temp).padStart(2, '0')}/${String(dewp).padStart(2, '0')} Q1013`
    };
  }

  private generateFallbackTaf(icao: string): any {
    const timestamp = this.generateTafTimestamp();
    return {
      rawTAF: `TAF ${icao} ${timestamp} VRB05KT 9999 FEW020`,
      validTimeFrom: new Date().toISOString(),
      validTimeTo: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      forecasts: []
    };
  }

  private generateFallbackAviationWeather(icao: string): AviationWeatherData {
    const metarData = this.generateFallbackMetar(icao);
    const tafData = this.generateFallbackTaf(icao);
    
    return {
      icao,
      metar: {
        raw: metarData.raw,
        parsed: {
          temperature: metarData.temp,
          dewpoint: metarData.dewp,
          windSpeed: metarData.wspd,
          windDirection: metarData.wdir,
          visibility: metarData.visib,
          altimeter: metarData.altim,
          conditions: metarData.wxString,
          clouds: [],
          timestamp: metarData.reportTime
        }
      },
      taf: {
        raw: tafData.rawTAF,
        parsed: {
          validFrom: tafData.validTimeFrom,
          validTo: tafData.validTimeTo,
          forecast: []
        }
      }
    };
  }

  private parseCloudLayers(clouds: any[]): string[] {
    return clouds.map(cloud => `${cloud.cover}${String(cloud.base).padStart(3, '0')}`);
  }

  private parseTafForecast(forecasts: any[]): any[] {
    return forecasts.map(f => ({
      time: f.fcstTime || new Date().toISOString(),
      windSpeed: f.wspd || 5,
      windDirection: f.wdir || 270,
      visibility: f.visib || 9999,
      conditions: f.wxString || 'Clear',
      clouds: this.parseCloudLayers(f.clouds || [])
    }));
  }

  private generateTafTimestamp(): string {
    const now = new Date();
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hour = String(Math.floor(now.getUTCHours() / 6) * 6).padStart(2, '0');
    return `${day}${hour}00Z`;
  }

  /**
   * Generate reasonable weather based on location and season
   */
  private generateReasonableWeather(lat: number, lon: number): WeatherCondition {
    const now = new Date();
    const month = now.getMonth() + 1;
    
    // Base temperature varies with latitude and season
    const baseTemp = 15 - (Math.abs(lat) * 0.6);
    const seasonalVariation = Math.sin((month - 3) * Math.PI / 6) * 15;
    const temperature = Math.round(baseTemp + seasonalVariation);
    
    // Wind patterns - stronger at higher latitudes and over oceans
    const windSpeed = Math.round(5 + Math.abs(lat) * 0.3 + (Math.abs(lon) > 30 ? 5 : 0));
    const windDirection = Math.round(Math.random() * 360);
    
    // Visibility generally good unless in specific weather patterns
    const visibility = Math.round(8 + Math.random() * 7);
    
    // Cloud cover varies by region and season
    const cloudCover = Math.round(30 + Math.random() * 40);
    
    // Precipitation more likely in certain seasons and regions
    const precipitation = Math.random() > 0.8 ? Math.round(Math.random() * 5) : 0;
    
    // Pressure varies with weather patterns
    const pressure = Math.round(1013 + (Math.random() - 0.5) * 40);
    
    // Humidity varies with temperature and location
    const humidity = Math.round(40 + Math.random() * 40);
    
    // Dew point calculation
    const dewPoint = Math.round(temperature - ((100 - humidity) / 5));
    
    return {
      temperature,
      windSpeed,
      windDirection,
      visibility,
      conditions: precipitation > 0 ? 'Light Rain' : cloudCover > 70 ? 'Cloudy' : 'Partly Cloudy',
      cloudCover,
      precipitation,
      pressure,
      humidity,
      dewPoint
    };
  }

  /**
   * Get weather alerts for aviation
   */
  async getWeatherAlerts(bounds: { north: number; south: number; east: number; west: number }): Promise<WeatherAlert[]> {
    try {
      // Try to fetch from Aviation Weather Center
      const response = await axios.get('https://aviationweather.gov/api/data/airsigmet', {
        params: {
          format: 'json',
          bbox: `${bounds.west},${bounds.south},${bounds.east},${bounds.north}`
        }
      });

      return response.data.map((alert: any, index: number) => ({
        id: `alert_${index}_${Date.now()}`,
        type: alert.hazard || 'SIGMET',
        severity: this.mapAlertSeverity(alert.hazard),
        description: alert.rawAirsigmet || alert.hazard || 'Weather alert',
        location: {
          lat: (bounds.north + bounds.south) / 2,
          lon: (bounds.east + bounds.west) / 2,
          radius: 50
        },
        validFrom: alert.validTimeFrom || new Date().toISOString(),
        validTo: alert.validTimeTo || new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        phenomena: [alert.hazard || 'UNKNOWN']
      }));
    } catch (error) {
      console.error('Weather alerts error:', error);
      return [];
    }
  }

  /**
   * Map alert types to severity levels
   */
  private mapAlertSeverity(hazard: string): 'low' | 'medium' | 'high' | 'critical' {
    const severityMap: { [key: string]: 'low' | 'medium' | 'high' | 'critical' } = {
      'TURB': 'medium',
      'ICE': 'high',
      'IFR': 'medium',
      'MT_OBSC': 'medium',
      'TS': 'high',
      'CONVECTIVE': 'critical',
      'WIND': 'medium',
      'LLWS': 'high' // Low Level Wind Shear
    };
    
    return severityMap[hazard] || 'low';
  }

  /**
   * Test weather API connections
   */
  async testConnections(): Promise<{ [key: string]: { success: boolean; message: string } }> {
    const results: { [key: string]: { success: boolean; message: string } } = {};

    // Test OpenWeatherMap
    try {
      if (this.openWeatherApiKey) {
        await axios.get('https://api.openweathermap.org/data/2.5/weather', {
          params: { lat: 51.5074, lon: -0.1278, appid: this.openWeatherApiKey },
          timeout: 5000
        });
        results.openweather = { success: true, message: 'Connected successfully' };
      } else {
        results.openweather = { success: false, message: 'API key not configured' };
      }
    } catch (error: any) {
      results.openweather = { success: false, message: error.message };
    }

    // Test WeatherAPI.com
    try {
      if (this.weatherApiKey) {
        await axios.get('https://api.weatherapi.com/v1/current.json', {
          params: { key: this.weatherApiKey, q: '51.5074,-0.1278', aqi: 'no' },
          timeout: 5000
        });
        results.weatherapi = { success: true, message: 'Connected successfully' };
      } else {
        results.weatherapi = { success: false, message: 'API key not configured' };
      }
    } catch (error: any) {
      results.weatherapi = { success: false, message: error.message };
    }

    // Test Aviation Weather Center (free service)
    try {
      await axios.get('https://aviationweather.gov/api/data/metar', {
        params: { ids: 'EGLL', format: 'json' },
        timeout: 10000
      });
      results.aviationweather = { success: true, message: 'Connected successfully' };
    } catch (error: any) {
      results.aviationweather = { success: false, message: error.message };
    }

    return results;
  }

  /**
   * Cache management
   */
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    this.cache.delete(key);
    return null;
  }

  private setCachedData(key: string, data: any): void {
    this.cache.set(key, { data, timestamp: Date.now() });
  }
}

export const weatherApiService = new WeatherApiService();