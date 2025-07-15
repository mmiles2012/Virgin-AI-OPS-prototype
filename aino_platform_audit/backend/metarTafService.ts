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

  /**
   * Batch weather data collection for multiple airports
   */
  async getWeatherBatch(airportCodes: string[]): Promise<Array<{
    icao: string;
    timestamp: string;
    visibility: number;
    windSpeed: number;
    windDirection: number;
    temperature: number;
    dewpoint: number;
    pressure: number;
    conditions: string;
    cloudCoverage: string;
    delayRiskScore: number;
    operationalImpact: string;
    crosswindComponent: number;
    icingRisk: boolean;
    precipitationType: string;
    weatherQuality: 'good' | 'marginal' | 'poor';
  }>> {
    const weatherData: any[] = [];
    
    // Process airports in parallel with rate limiting
    const chunkSize = 3; // Prevent API rate limiting
    for (let i = 0; i < airportCodes.length; i += chunkSize) {
      const chunk = airportCodes.slice(i, i + chunkSize);
      
      const chunkPromises = chunk.map(async (icao) => {
        try {
          const { metar, impact } = await this.getWeatherDataForTraining(icao);
          
          if (metar && impact) {
            return {
              icao,
              timestamp: metar.timestamp,
              visibility: metar.visibility,
              windSpeed: metar.windSpeed,
              windDirection: metar.windDirection,
              temperature: metar.temperature,
              dewpoint: metar.dewpoint,
              pressure: metar.pressure,
              conditions: metar.conditions.join(';'),
              cloudCoverage: metar.cloudCoverage,
              delayRiskScore: impact.delayRiskScore,
              operationalImpact: impact.operationalImpact,
              crosswindComponent: impact.wind.crosswind,
              icingRisk: impact.temperature.icingRisk,
              precipitationType: impact.precipitation.type || 'none',
              weatherQuality: this.categorizeWeatherQuality(impact.delayRiskScore)
            };
          }
          return null;
        } catch (error) {
          console.error(`Error fetching weather for ${icao}:`, error);
          return null;
        }
      });

      const chunkResults = await Promise.all(chunkPromises);
      weatherData.push(...chunkResults.filter(result => result !== null));
      
      // Add delay between chunks to respect rate limits
      if (i + chunkSize < airportCodes.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return weatherData;
  }

  /**
   * Get historical weather patterns for training enhancement
   */
  async getHistoricalWeatherPatterns(icao: string, hours: number = 24): Promise<{
    patterns: {
      hour: number;
      avgVisibility: number;
      avgWindSpeed: number;
      avgTemperature: number;
      commonConditions: string[];
      delayFrequency: number;
    }[];
    trends: {
      visibilityTrend: 'improving' | 'deteriorating' | 'stable';
      temperatureTrend: 'warming' | 'cooling' | 'stable';
      windTrend: 'increasing' | 'decreasing' | 'stable';
    };
  }> {
    // This would typically fetch from a historical weather database
    // For now, we'll return a structured response that models can use
    
    const patterns = [];
    for (let hour = 0; hour < hours; hour++) {
      patterns.push({
        hour,
        avgVisibility: 8000 + Math.random() * 2000,
        avgWindSpeed: 5 + Math.random() * 15,
        avgTemperature: 10 + Math.random() * 20,
        commonConditions: Math.random() > 0.7 ? ['Rain'] : [],
        delayFrequency: Math.random() * 0.3
      });
    }

    return {
      patterns,
      trends: {
        visibilityTrend: 'stable',
        temperatureTrend: 'stable',
        windTrend: 'stable'
      }
    };
  }

  /**
   * Real-time weather monitoring for continuous model training
   */
  async startWeatherMonitoring(airports: string[], intervalMinutes: number = 15): Promise<void> {
    console.log(`Starting weather monitoring for ${airports.length} airports every ${intervalMinutes} minutes`);
    
    const monitoringInterval = setInterval(async () => {
      try {
        const weatherBatch = await this.getWeatherBatch(airports);
        
        // Store weather data for model training
        await this.storeWeatherDataForTraining(weatherBatch);
        
        // Analyze trends and update predictions
        const significantChanges = weatherBatch.filter(w => w.delayRiskScore > 5);
        if (significantChanges.length > 0) {
          console.log(`Weather alerts for ${significantChanges.length} airports:`, 
            significantChanges.map(w => `${w.icao}: ${w.operationalImpact}`));
        }
        
      } catch (error) {
        console.error('Weather monitoring error:', error);
      }
    }, intervalMinutes * 60 * 1000);

    // Store interval reference for cleanup
    (global as any).weatherMonitoringInterval = monitoringInterval;
  }

  /**
   * Store weather data for model training
   */
  private async storeWeatherDataForTraining(weatherData: any[]): Promise<void> {
    // This would typically store to a database or data lake
    // For now, we'll log the structured data that models can use
    
    const trainingFeatures = weatherData.map(w => ({
      timestamp: w.timestamp,
      airport: w.icao,
      visibility_score: this.normalizeVisibility(w.visibility),
      wind_score: this.normalizeWindSpeed(w.windSpeed),
      temperature_score: this.normalizeTemperature(w.temperature),
      pressure_score: this.normalizePressure(w.pressure),
      weather_complexity: w.conditions.split(';').length,
      delay_risk: w.delayRiskScore,
      operational_impact_numeric: this.convertOperationalImpactToNumeric(w.operationalImpact)
    }));

    console.log(`Processed ${trainingFeatures.length} weather records for model training`);
  }

  /**
   * Weather quality categorization for model features
   */
  private categorizeWeatherQuality(delayRiskScore: number): 'good' | 'marginal' | 'poor' {
    if (delayRiskScore <= 2) return 'good';
    if (delayRiskScore <= 5) return 'marginal';
    return 'poor';
  }

  /**
   * Normalization functions for model features
   */
  private normalizeVisibility(visibility: number): number {
    // Normalize visibility to 0-1 scale (0 = poor, 1 = excellent)
    return Math.min(1, visibility / 10000);
  }

  private normalizeWindSpeed(windSpeed: number): number {
    // Normalize wind speed to 0-1 scale (0 = calm, 1 = very strong)
    return Math.min(1, windSpeed / 50);
  }

  private normalizeTemperature(temperature: number): number {
    // Normalize temperature to 0-1 scale (-40°C to +50°C range)
    return Math.max(0, Math.min(1, (temperature + 40) / 90));
  }

  private normalizePressure(pressure: number): number {
    // Normalize pressure to 0-1 scale (950-1050 hPa range)
    return Math.max(0, Math.min(1, (pressure - 950) / 100));
  }

  private convertOperationalImpactToNumeric(impact: string): number {
    const mapping: { [key: string]: number } = {
      'minimal': 0.25,
      'moderate': 0.5,
      'significant': 0.75,
      'severe': 1.0
    };
    return mapping[impact] || 0;
  }

  /**
   * Generate weather-enhanced training dataset
   */
  async generateWeatherEnhancedDataset(
    airportCodes: string[],
    outputPath?: string
  ): Promise<{
    success: boolean;
    recordCount: number;
    features: string[];
    filePath?: string;
  }> {
    try {
      console.log(`Generating weather-enhanced dataset for ${airportCodes.length} airports`);
      
      const weatherData = await this.getWeatherBatch(airportCodes);
      
      if (weatherData.length === 0) {
        return {
          success: false,
          recordCount: 0,
          features: []
        };
      }

      // Enhanced feature engineering
      const enhancedData = weatherData.map(w => ({
        ...w,
        // Additional computed features for ML models
        temperatureDewpointSpread: w.temperature - w.dewpoint,
        windSpeedCategory: this.categorizeWindSpeed(w.windSpeed),
        visibilityCategory: this.categorizeVisibility(w.visibility),
        seasonalFactor: this.getSeasonalFactor(new Date(w.timestamp)),
        timeOfDayFactor: this.getTimeOfDayFactor(new Date(w.timestamp)),
        weatherComplexityIndex: w.conditions.split(';').length + 
                               (w.icingRisk ? 2 : 0) + 
                               (w.delayRiskScore > 5 ? 3 : 0)
      }));

      const features = Object.keys(enhancedData[0]);
      
      if (outputPath) {
        // In a real implementation, this would write to CSV
        console.log(`Weather dataset would be saved to: ${outputPath}`);
      }

      return {
        success: true,
        recordCount: enhancedData.length,
        features,
        filePath: outputPath
      };
      
    } catch (error) {
      console.error('Error generating weather dataset:', error);
      return {
        success: false,
        recordCount: 0,
        features: []
      };
    }
  }

  private categorizeWindSpeed(speed: number): string {
    if (speed <= 5) return 'calm';
    if (speed <= 15) return 'light';
    if (speed <= 25) return 'moderate';
    if (speed <= 35) return 'strong';
    return 'very_strong';
  }

  private categorizeVisibility(visibility: number): string {
    if (visibility >= 8000) return 'excellent';
    if (visibility >= 5000) return 'good';
    if (visibility >= 3000) return 'moderate';
    if (visibility >= 1200) return 'poor';
    return 'very_poor';
  }

  private getSeasonalFactor(date: Date): number {
    const month = date.getMonth();
    // Winter months (Dec, Jan, Feb) have higher delay probability
    if (month === 11 || month === 0 || month === 1) return 0.8;
    // Summer months (Jun, Jul, Aug) typically better
    if (month >= 5 && month <= 7) return 0.2;
    // Spring/Fall
    return 0.5;
  }

  private getTimeOfDayFactor(date: Date): number {
    const hour = date.getHours();
    // Peak traffic hours have higher delay probability
    if ((hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 20)) return 0.8;
    // Night/early morning
    if (hour >= 22 || hour <= 5) return 0.2;
    // Mid-day
    return 0.4;
  }
}

export const metarTafService = new MetarTafService();