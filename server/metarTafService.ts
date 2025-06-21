import axios from 'axios';

interface MetarData {
  icao: string;
  metar: string;
  timestamp: string;
  visibility: number;
  windSpeed: number;
  windDirection: number;
  temperature: number;
  dewpoint: number;
  pressure: number;
  conditions: string[];
  cloudCoverage: string;
  precipitationType?: string;
  turbulence?: string;
  icing?: string;
}

interface TafData {
  icao: string;
  taf: string;
  timestamp: string;
  validFrom: string;
  validTo: string;
  forecasts: {
    time: string;
    visibility: number;
    windSpeed: number;
    windDirection: number;
    conditions: string[];
    cloudCoverage: string;
    precipitationProb?: number;
  }[];
}

interface WeatherImpactAnalysis {
  delayRiskScore: number; // 0-10 scale
  operationalImpact: 'minimal' | 'moderate' | 'significant' | 'severe';
  primaryFactors: string[];
  recommendations: string[];
  visibility: {
    current: number;
    minimums: number;
    impact: 'none' | 'low' | 'medium' | 'high';
  };
  wind: {
    speed: number;
    direction: number;
    crosswind: number;
    impact: 'none' | 'low' | 'medium' | 'high';
  };
  precipitation: {
    type?: string;
    intensity?: string;
    impact: 'none' | 'low' | 'medium' | 'high';
  };
  temperature: {
    current: number;
    dewpoint: number;
    icingRisk: boolean;
    impact: 'none' | 'low' | 'medium' | 'high';
  };
}

export class MetarTafService {
  private aviationWeatherKey: string;
  private checkWxKey: string;
  private weatherUnlockedKey: string;

  constructor() {
    this.aviationWeatherKey = process.env.AVIATION_WEATHER_API_KEY || '';
    this.checkWxKey = process.env.CHECKWX_API_KEY || '';
    this.weatherUnlockedKey = process.env.WEATHER_UNLOCKED_API_KEY || '';
  }

  /**
   * Get METAR data from multiple sources for reliability
   */
  async getMetarData(icao: string): Promise<MetarData | null> {
    try {
      // Primary source: Aviation Weather Center (NOAA)
      const awcData = await this.getMetarFromAWC(icao);
      if (awcData) return awcData;

      // Fallback: CheckWX API
      const checkWxData = await this.getMetarFromCheckWX(icao);
      if (checkWxData) return checkWxData;

      // Fallback: Weather Unlocked
      const weatherUnlockedData = await this.getMetarFromWeatherUnlocked(icao);
      if (weatherUnlockedData) return weatherUnlockedData;

      return null;
    } catch (error) {
      console.error(`Failed to get METAR data for ${icao}:`, error);
      return null;
    }
  }

  /**
   * Get TAF data from multiple sources
   */
  async getTafData(icao: string): Promise<TafData | null> {
    try {
      // Primary source: Aviation Weather Center (NOAA)
      const awcData = await this.getTafFromAWC(icao);
      if (awcData) return awcData;

      // Fallback: CheckWX API
      const checkWxData = await this.getTafFromCheckWX(icao);
      if (checkWxData) return checkWxData;

      return null;
    } catch (error) {
      console.error(`Failed to get TAF data for ${icao}:`, error);
      return null;
    }
  }

  /**
   * Aviation Weather Center (NOAA) - Free and reliable
   */
  private async getMetarFromAWC(icao: string): Promise<MetarData | null> {
    try {
      const response = await axios.get(
        `https://aviationweather.gov/api/data/metar?ids=${icao}&format=json&taf=false&hours=3&bbox=40,-90,45,-85`
      );

      if (response.data && response.data.length > 0) {
        const metar = response.data[0];
        return this.parseMetarData(metar.rawOb, icao);
      }
      return null;
    } catch (error) {
      console.error(`AWC METAR error for ${icao}:`, error);
      return null;
    }
  }

  /**
   * CheckWX API - Commercial service with good reliability
   */
  private async getMetarFromCheckWX(icao: string): Promise<MetarData | null> {
    if (!this.checkWxKey) return null;

    try {
      const response = await axios.get(
        `https://api.checkwx.com/metar/${icao}/decoded`,
        {
          headers: {
            'X-API-Key': this.checkWxKey
          }
        }
      );

      if (response.data && response.data.data && response.data.data.length > 0) {
        const metar = response.data.data[0];
        return {
          icao,
          metar: metar.raw_text,
          timestamp: metar.observed,
          visibility: metar.visibility?.meters_float || 9999,
          windSpeed: metar.wind?.speed_kts || 0,
          windDirection: metar.wind?.degrees || 0,
          temperature: metar.temperature?.celsius || 15,
          dewpoint: metar.dewpoint?.celsius || 10,
          pressure: metar.barometer?.hpa || 1013,
          conditions: metar.conditions?.map((c: any) => c.text) || [],
          cloudCoverage: metar.clouds?.[0]?.text || 'CLR'
        };
      }
      return null;
    } catch (error) {
      console.error(`CheckWX METAR error for ${icao}:`, error);
      return null;
    }
  }

  /**
   * Weather Unlocked API
   */
  private async getMetarFromWeatherUnlocked(icao: string): Promise<MetarData | null> {
    if (!this.weatherUnlockedKey) return null;

    try {
      const response = await axios.get(
        `https://api.weatherunlocked.com/api/aviation/metar/${icao}?app_id=${this.weatherUnlockedKey}`
      );

      if (response.data) {
        return this.parseMetarData(response.data.metar, icao);
      }
      return null;
    } catch (error) {
      console.error(`Weather Unlocked METAR error for ${icao}:`, error);
      return null;
    }
  }

  /**
   * TAF from Aviation Weather Center
   */
  private async getTafFromAWC(icao: string): Promise<TafData | null> {
    try {
      const response = await axios.get(
        `https://aviationweather.gov/api/data/taf?ids=${icao}&format=json&hours=12`
      );

      if (response.data && response.data.length > 0) {
        const taf = response.data[0];
        return this.parseTafData(taf.rawTAF, icao);
      }
      return null;
    } catch (error) {
      console.error(`AWC TAF error for ${icao}:`, error);
      return null;
    }
  }

  /**
   * TAF from CheckWX
   */
  private async getTafFromCheckWX(icao: string): Promise<TafData | null> {
    if (!this.checkWxKey) return null;

    try {
      const response = await axios.get(
        `https://api.checkwx.com/taf/${icao}/decoded`,
        {
          headers: {
            'X-API-Key': this.checkWxKey
          }
        }
      );

      if (response.data && response.data.data && response.data.data.length > 0) {
        const taf = response.data.data[0];
        return {
          icao,
          taf: taf.raw_text,
          timestamp: taf.timestamp.issued,
          validFrom: taf.timestamp.from,
          validTo: taf.timestamp.to,
          forecasts: taf.forecast?.map((f: any) => ({
            time: f.timestamp.from,
            visibility: f.visibility?.meters_float || 9999,
            windSpeed: f.wind?.speed_kts || 0,
            windDirection: f.wind?.degrees || 0,
            conditions: f.conditions?.map((c: any) => c.text) || [],
            cloudCoverage: f.clouds?.[0]?.text || 'CLR',
            precipitationProb: f.probability || undefined
          })) || []
        };
      }
      return null;
    } catch (error) {
      console.error(`CheckWX TAF error for ${icao}:`, error);
      return null;
    }
  }

  /**
   * Parse raw METAR string into structured data
   */
  private parseMetarData(rawMetar: string, icao: string): MetarData {
    // Basic METAR parsing - this is a simplified version
    const parts = rawMetar.split(' ');
    
    let visibility = 9999;
    let windSpeed = 0;
    let windDirection = 0;
    let temperature = 15;
    let dewpoint = 10;
    let pressure = 1013;
    const conditions: string[] = [];
    let cloudCoverage = 'CLR';

    // Parse wind (e.g., "27008KT")
    const windMatch = rawMetar.match(/(\d{3})(\d{2,3})KT/);
    if (windMatch) {
      windDirection = parseInt(windMatch[1]);
      windSpeed = parseInt(windMatch[2]);
    }

    // Parse visibility (e.g., "9999" or "1/2SM")
    const visMatch = rawMetar.match(/\b(\d{4})\b/);
    if (visMatch) {
      visibility = parseInt(visMatch[1]);
    }

    // Parse temperature/dewpoint (e.g., "M05/M10" or "15/08")
    const tempMatch = rawMetar.match(/(M?\d{2})\/(M?\d{2})/);
    if (tempMatch) {
      temperature = parseInt(tempMatch[1].replace('M', '-'));
      dewpoint = parseInt(tempMatch[2].replace('M', '-'));
    }

    // Parse pressure (e.g., "Q1013" or "A2992")
    const pressureMatch = rawMetar.match(/[QA](\d{4})/);
    if (pressureMatch) {
      const value = parseInt(pressureMatch[1]);
      pressure = rawMetar.includes('Q') ? value : Math.round(value * 0.3386);
    }

    // Parse conditions
    if (rawMetar.includes('RA')) conditions.push('Rain');
    if (rawMetar.includes('SN')) conditions.push('Snow');
    if (rawMetar.includes('FG')) conditions.push('Fog');
    if (rawMetar.includes('BR')) conditions.push('Mist');
    if (rawMetar.includes('TS')) conditions.push('Thunderstorm');

    // Parse clouds
    if (rawMetar.includes('OVC')) cloudCoverage = 'Overcast';
    else if (rawMetar.includes('BKN')) cloudCoverage = 'Broken';
    else if (rawMetar.includes('SCT')) cloudCoverage = 'Scattered';
    else if (rawMetar.includes('FEW')) cloudCoverage = 'Few';

    return {
      icao,
      metar: rawMetar,
      timestamp: new Date().toISOString(),
      visibility,
      windSpeed,
      windDirection,
      temperature,
      dewpoint,
      pressure,
      conditions,
      cloudCoverage
    };
  }

  /**
   * Parse raw TAF string into structured data
   */
  private parseTafData(rawTaf: string, icao: string): TafData {
    // Simplified TAF parsing
    const lines = rawTaf.split('\n');
    const forecasts: any[] = [];

    // Extract validity period
    const validityMatch = rawTaf.match(/(\d{6})\/(\d{6})/);
    const validFrom = validityMatch ? validityMatch[1] : '';
    const validTo = validityMatch ? validityMatch[2] : '';

    return {
      icao,
      taf: rawTaf,
      timestamp: new Date().toISOString(),
      validFrom,
      validTo,
      forecasts
    };
  }

  /**
   * Analyze weather impact on flight operations
   */
  analyzeWeatherImpact(metar: MetarData, runwayHeading: number = 270): WeatherImpactAnalysis {
    let delayRiskScore = 0;
    const primaryFactors: string[] = [];
    const recommendations: string[] = [];

    // Visibility analysis
    const visibilityImpact = this.analyzeVisibility(metar.visibility);
    if (visibilityImpact.impact !== 'none') {
      delayRiskScore += visibilityImpact.score;
      primaryFactors.push(`Poor visibility: ${metar.visibility}m`);
    }

    // Wind analysis
    const windImpact = this.analyzeWind(metar.windSpeed, metar.windDirection, runwayHeading);
    if (windImpact.impact !== 'none') {
      delayRiskScore += windImpact.score;
      primaryFactors.push(`Wind conditions: ${metar.windSpeed}kt from ${metar.windDirection}°`);
    }

    // Precipitation analysis
    const precipitationImpact = this.analyzePrecipitation(metar.conditions);
    if (precipitationImpact.impact !== 'none') {
      delayRiskScore += precipitationImpact.score;
      primaryFactors.push(`Weather conditions: ${metar.conditions.join(', ')}`);
    }

    // Temperature analysis
    const temperatureImpact = this.analyzeTemperature(metar.temperature, metar.dewpoint);
    if (temperatureImpact.impact !== 'none') {
      delayRiskScore += temperatureImpact.score;
    }

    // Determine operational impact
    let operationalImpact: 'minimal' | 'moderate' | 'significant' | 'severe';
    if (delayRiskScore <= 2) operationalImpact = 'minimal';
    else if (delayRiskScore <= 5) operationalImpact = 'moderate';
    else if (delayRiskScore <= 8) operationalImpact = 'significant';
    else operationalImpact = 'severe';

    // Generate recommendations
    if (visibilityImpact.impact === 'high') {
      recommendations.push('Consider CAT III approach procedures');
      recommendations.push('Monitor visibility trends closely');
    }
    if (windImpact.crosswind > 25) {
      recommendations.push('Assess crosswind landing capabilities');
      recommendations.push('Consider alternate runway if available');
    }
    if (precipitationImpact.impact === 'high') {
      recommendations.push('Implement de-icing procedures');
      recommendations.push('Increase runway separation');
    }

    return {
      delayRiskScore: Math.min(10, delayRiskScore),
      operationalImpact,
      primaryFactors,
      recommendations,
      visibility: {
        current: metar.visibility,
        minimums: 550, // CAT I minimums
        impact: visibilityImpact.impact
      },
      wind: {
        speed: metar.windSpeed,
        direction: metar.windDirection,
        crosswind: windImpact.crosswind,
        impact: windImpact.impact
      },
      precipitation: {
        type: metar.conditions.find(c => ['Rain', 'Snow', 'Sleet'].includes(c)),
        intensity: metar.conditions.find(c => c.includes('Heavy')) ? 'Heavy' : 
                  metar.conditions.find(c => c.includes('Light')) ? 'Light' : 'Moderate',
        impact: precipitationImpact.impact
      },
      temperature: {
        current: metar.temperature,
        dewpoint: metar.dewpoint,
        icingRisk: temperatureImpact.icingRisk,
        impact: temperatureImpact.impact
      }
    };
  }

  private analyzeVisibility(visibility: number): { impact: 'none' | 'low' | 'medium' | 'high', score: number } {
    if (visibility >= 8000) return { impact: 'none', score: 0 };
    if (visibility >= 3000) return { impact: 'low', score: 1 };
    if (visibility >= 1200) return { impact: 'medium', score: 3 };
    if (visibility >= 550) return { impact: 'high', score: 5 };
    return { impact: 'high', score: 7 };
  }

  private analyzeWind(speed: number, direction: number, runwayHeading: number): { 
    impact: 'none' | 'low' | 'medium' | 'high', 
    score: number, 
    crosswind: number 
  } {
    // Calculate crosswind component
    const windAngle = Math.abs(direction - runwayHeading);
    const adjustedAngle = Math.min(windAngle, 360 - windAngle);
    const crosswind = Math.abs(speed * Math.sin(adjustedAngle * Math.PI / 180));

    if (speed <= 10 && crosswind <= 10) return { impact: 'none', score: 0, crosswind };
    if (speed <= 20 && crosswind <= 15) return { impact: 'low', score: 1, crosswind };
    if (speed <= 30 && crosswind <= 25) return { impact: 'medium', score: 2, crosswind };
    return { impact: 'high', score: 4, crosswind };
  }

  private analyzePrecipitation(conditions: string[]): { impact: 'none' | 'low' | 'medium' | 'high', score: number } {
    if (conditions.length === 0) return { impact: 'none', score: 0 };
    
    const hasThunderstorm = conditions.some(c => c.includes('Thunderstorm'));
    const hasSnow = conditions.some(c => c.includes('Snow'));
    const hasHeavyRain = conditions.some(c => c.includes('Rain') && c.includes('Heavy'));
    
    if (hasThunderstorm) return { impact: 'high', score: 5 };
    if (hasSnow || hasHeavyRain) return { impact: 'high', score: 4 };
    if (conditions.some(c => c.includes('Rain'))) return { impact: 'medium', score: 2 };
    return { impact: 'low', score: 1 };
  }

  private analyzeTemperature(temperature: number, dewpoint: number): { 
    impact: 'none' | 'low' | 'medium' | 'high', 
    score: number,
    icingRisk: boolean 
  } {
    const dewpointSpread = temperature - dewpoint;
    const icingRisk = temperature >= -10 && temperature <= 5 && dewpointSpread <= 3;
    
    if (temperature <= -30 || temperature >= 45) return { impact: 'high', score: 3, icingRisk };
    if (icingRisk) return { impact: 'medium', score: 2, icingRisk };
    if (dewpointSpread <= 1) return { impact: 'low', score: 1, icingRisk }; // Fog risk
    
    return { impact: 'none', score: 0, icingRisk };
  }

  /**
   * Get comprehensive weather data for training models
   */
  async getWeatherDataForTraining(icao: string): Promise<{
    metar: MetarData | null;
    taf: TafData | null;
    impact: WeatherImpactAnalysis | null;
  }> {
    const metar = await this.getMetarData(icao);
    const taf = await this.getTafData(icao);
    const impact = metar ? this.analyzeWeatherImpact(metar) : null;

    return { metar, taf, impact };
  }
}

export const metarTafService = new MetarTafService();