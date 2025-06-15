export interface WeatherReport {
  conditions: 'VMC' | 'IMC' | 'MVFR';
  visibility: number; // km
  ceiling: number; // feet
  winds: {
    direction: number;
    speed: number;
    gusts?: number;
  };
  temperature: number;
  dewpoint: number;
  qnh: number; // hPa
  phenomena: string[];
  trend: string;
  timestamp: string;
}

export interface NOTAM {
  id: string;
  airport: string;
  type: 'runway' | 'taxiway' | 'equipment' | 'airspace' | 'procedure';
  description: string;
  effective: string;
  expires: string;
  status: 'active' | 'cancelled' | 'replaced';
  impact: 'low' | 'medium' | 'high' | 'critical';
}

export interface FuelPrice {
  airport: string;
  pricePerKg: number;
  currency: string;
  supplier: string;
  lastUpdated: string;
  contractRate: boolean;
  availability: 'excellent' | 'good' | 'limited' | 'unavailable';
}

export class DataFeeds {
  private static readonly WEATHER_CACHE = new Map<string, WeatherReport>();
  private static readonly NOTAM_CACHE = new Map<string, NOTAM[]>();
  private static readonly FUEL_CACHE = new Map<string, FuelPrice>();

  /**
   * Get weather report for destination
   */
  static getWeather(destination: string): WeatherReport {
    // Check cache first
    if (this.WEATHER_CACHE.has(destination)) {
      const cached = this.WEATHER_CACHE.get(destination)!;
      // Return cached if less than 30 minutes old
      if (new Date().getTime() - new Date(cached.timestamp).getTime() < 1800000) {
        return cached;
      }
    }

    // Generate realistic weather data based on airport
    const weather = this.generateWeatherReport(destination);
    this.WEATHER_CACHE.set(destination, weather);
    return weather;
  }

  /**
   * Get NOTAMs for airport
   */
  static getNOTAMs(airportCode: string): NOTAM[] {
    // Check cache first
    if (this.NOTAM_CACHE.has(airportCode)) {
      return this.NOTAM_CACHE.get(airportCode)!;
    }

    // Generate realistic NOTAMs
    const notams = this.generateNOTAMs(airportCode);
    this.NOTAM_CACHE.set(airportCode, notams);
    return notams;
  }

  /**
   * Get fuel price for airport
   */
  static getFuelPrice(airportCode: string): FuelPrice {
    // Check cache first
    if (this.FUEL_CACHE.has(airportCode)) {
      return this.FUEL_CACHE.get(airportCode)!;
    }

    // Generate realistic fuel pricing
    const fuelPrice = this.generateFuelPrice(airportCode);
    this.FUEL_CACHE.set(airportCode, fuelPrice);
    return fuelPrice;
  }

  private static generateWeatherReport(destination: string): WeatherReport {
    const currentTime = new Date();
    
    // Base weather on airport location and time
    const weatherPatterns = {
      'EGLL': { baseVis: 8, baseCeiling: 1500, baseWind: 12 }, // London
      'EHAM': { baseVis: 6, baseCeiling: 1200, baseWind: 15 }, // Amsterdam
      'EDDF': { baseVis: 9, baseCeiling: 1800, baseWind: 10 }, // Frankfurt
      'LFPG': { baseVis: 7, baseCeiling: 1400, baseWind: 8 },  // Paris CDG
      'KJFK': { baseVis: 10, baseCeiling: 2000, baseWind: 14 }, // JFK
      'KORD': { baseVis: 8, baseCeiling: 1600, baseWind: 16 },  // Chicago
    };

    const pattern = weatherPatterns[destination as keyof typeof weatherPatterns] || 
                   { baseVis: 8, baseCeiling: 1500, baseWind: 12 };

    const visibility = Math.max(1, pattern.baseVis + (Math.random() - 0.5) * 4);
    const ceiling = Math.max(200, pattern.baseCeiling + (Math.random() - 0.5) * 800);
    const windSpeed = Math.max(0, pattern.baseWind + (Math.random() - 0.5) * 10);

    const conditions: 'VMC' | 'IMC' | 'MVFR' = 
      visibility >= 8 && ceiling >= 1500 ? 'VMC' :
      visibility >= 5 && ceiling >= 1000 ? 'MVFR' : 'IMC';

    const phenomena: string[] = [];
    if (visibility < 5) phenomena.push('Mist');
    if (ceiling < 500) phenomena.push('Low Cloud');
    if (windSpeed > 20) phenomena.push('Strong Winds');

    return {
      conditions,
      visibility: Math.round(visibility * 10) / 10,
      ceiling: Math.round(ceiling),
      winds: {
        direction: Math.round(Math.random() * 360),
        speed: Math.round(windSpeed),
        gusts: windSpeed > 15 ? Math.round(windSpeed + 5 + Math.random() * 10) : undefined
      },
      temperature: Math.round(15 + (Math.random() - 0.5) * 20),
      dewpoint: Math.round(10 + (Math.random() - 0.5) * 15),
      qnh: Math.round(1013 + (Math.random() - 0.5) * 40),
      phenomena,
      trend: Math.random() > 0.7 ? 'NOSIG' : 'BECMG',
      timestamp: currentTime.toISOString()
    };
  }

  private static generateNOTAMs(airportCode: string): NOTAM[] {
    const notams: NOTAM[] = [];
    const currentTime = new Date();
    
    // Generate 1-3 realistic NOTAMs
    const notamCount = Math.floor(Math.random() * 3) + 1;
    
    const notamTemplates = [
      {
        type: 'runway' as const,
        descriptions: [
          'Runway 27L closed for maintenance',
          'Runway 09R reduced width due to construction',
          'Runway 16/34 intermittent closures for snow clearance'
        ]
      },
      {
        type: 'equipment' as const,
        descriptions: [
          'ILS Runway 24 unserviceable',
          'Ground radar out of service',
          'ATIS frequency changed temporarily'
        ]
      },
      {
        type: 'procedure' as const,
        descriptions: [
          'Modified noise abatement procedures in effect',
          'Special VIP movement restrictions',
          'Temporary holding pattern changes'
        ]
      }
    ];

    for (let i = 0; i < notamCount; i++) {
      const template = notamTemplates[Math.floor(Math.random() * notamTemplates.length)];
      const description = template.descriptions[Math.floor(Math.random() * template.descriptions.length)];
      
      const effective = new Date(currentTime.getTime() - Math.random() * 24 * 60 * 60 * 1000);
      const expires = new Date(currentTime.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000);

      notams.push({
        id: `${airportCode}${String(i + 1).padStart(3, '0')}`,
        airport: airportCode,
        type: template.type,
        description,
        effective: effective.toISOString(),
        expires: expires.toISOString(),
        status: 'active',
        impact: template.type === 'runway' ? 'high' : 
               template.type === 'equipment' ? 'medium' : 'low'
      });
    }

    return notams;
  }

  private static generateFuelPrice(airportCode: string): FuelPrice {
    const currentTime = new Date();
    
    // Base prices by region (USD per kg)
    const basePrices = {
      'EGLL': 0.95, // London - higher due to taxes
      'EHAM': 0.82, // Amsterdam - competitive hub
      'EDDF': 0.87, // Frankfurt - moderate
      'LFPG': 0.90, // Paris - higher taxes
      'KJFK': 0.78, // JFK - US pricing
      'KORD': 0.76, // Chicago - US pricing
    };

    const basePrice = basePrices[airportCode as keyof typeof basePrices] || 0.85;
    
    // Add market fluctuation ±10%
    const marketVariation = (Math.random() - 0.5) * 0.2;
    const finalPrice = basePrice * (1 + marketVariation);

    const suppliers = ['Shell', 'BP', 'Total', 'ExxonMobil', 'Chevron'];
    const supplier = suppliers[Math.floor(Math.random() * suppliers.length)];

    return {
      airport: airportCode,
      pricePerKg: Math.round(finalPrice * 100) / 100,
      currency: 'USD',
      supplier,
      lastUpdated: currentTime.toISOString(),
      contractRate: Math.random() > 0.3, // 70% chance of contract rate
      availability: Math.random() > 0.1 ? 'excellent' : 'good' // 90% excellent availability
    };
  }

  /**
   * Get comprehensive airport operational data
   */
  static getAirportOperationalData(airportCode: string) {
    return {
      weather: this.getWeather(airportCode),
      notams: this.getNOTAMs(airportCode),
      fuelPrice: this.getFuelPrice(airportCode),
      summary: this.generateOperationalSummary(airportCode)
    };
  }

  private static generateOperationalSummary(airportCode: string): string {
    const weather = this.getWeather(airportCode);
    const notams = this.getNOTAMs(airportCode);
    const fuel = this.getFuelPrice(airportCode);

    const conditions = weather.conditions === 'VMC' ? 'Good visual conditions' :
                      weather.conditions === 'MVFR' ? 'Marginal visual conditions' :
                      'Instrument conditions';

    const notamSummary = notams.length > 0 ? 
      `${notams.length} active NOTAMs` : 'No significant NOTAMs';

    const windInfo = weather.winds.gusts ? 
      `Winds ${weather.winds.direction}°/${weather.winds.speed}G${weather.winds.gusts}kt` :
      `Winds ${weather.winds.direction}°/${weather.winds.speed}kt`;

    return `${airportCode}: ${conditions}. ${windInfo}. ${notamSummary}. Fuel: $${fuel.pricePerKg}/kg (${fuel.supplier}).`;
  }

  /**
   * Check for operational alerts
   */
  static getOperationalAlerts(airportCode: string): Array<{
    type: 'weather' | 'notam' | 'fuel' | 'operational';
    severity: 'info' | 'warning' | 'critical';
    message: string;
  }> {
    const alerts: Array<{
      type: 'weather' | 'notam' | 'fuel' | 'operational';
      severity: 'info' | 'warning' | 'critical';
      message: string;
    }> = [];

    const weather = this.getWeather(airportCode);
    const notams = this.getNOTAMs(airportCode);
    const fuel = this.getFuelPrice(airportCode);

    // Weather alerts
    if (weather.conditions === 'IMC') {
      alerts.push({
        type: 'weather',
        severity: 'warning',
        message: `Poor weather conditions at ${airportCode} - IFR approaches required`
      });
    }

    if (weather.winds.speed > 25) {
      alerts.push({
        type: 'weather',
        severity: 'warning',
        message: `Strong winds at ${airportCode} - ${weather.winds.speed}kt`
      });
    }

    // NOTAM alerts
    const criticalNotams = notams.filter(n => n.impact === 'critical' || n.impact === 'high');
    if (criticalNotams.length > 0) {
      alerts.push({
        type: 'notam',
        severity: 'critical',
        message: `${criticalNotams.length} critical NOTAMs active at ${airportCode}`
      });
    }

    // Fuel alerts
    if (fuel.availability === 'limited') {
      alerts.push({
        type: 'fuel',
        severity: 'warning',
        message: `Limited fuel availability at ${airportCode}`
      });
    }

    if (fuel.pricePerKg > 1.0) {
      alerts.push({
        type: 'fuel',
        severity: 'info',
        message: `High fuel prices at ${airportCode} - $${fuel.pricePerKg}/kg`
      });
    }

    return alerts;
  }
}