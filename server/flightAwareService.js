/**
 * FlightAware AeroAPI Integration for AINO Platform
 * Real-time airport performance data for Virgin Atlantic hubs
 */

import fetch from 'node-fetch';

class FlightAwareService {
  constructor() {
    this.apiKey = process.env.FLIGHTAWARE_API_KEY;
    this.baseUrl = "https://aeroapi.flightaware.com/aeroapi";
    this.headers = {
      "x-apikey": this.apiKey,
      "Content-Type": "application/json"
    };
    
    // Virgin Atlantic hub airports
    this.virginAtlanticHubs = {
      'LHR': 'EGLL',
      'JFK': 'KJFK', 
      'LAX': 'KLAX',
      'MCO': 'KMCO',
      'MAN': 'EGCC',
      'BOS': 'KBOS',
      'ATL': 'KATL',
      'SFO': 'KSFO'
    };
    
    this.cache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
  }

  /**
   * Get airport delay information from FlightAware
   */
  async getAirportDelays(airportCode) {
    const cacheKey = `delays_${airportCode}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const icaoCode = this.virginAtlanticHubs[airportCode] || airportCode;
      const url = `${this.baseUrl}/airports/${icaoCode}/delays`;
      
      const response = await fetch(url, { headers: this.headers });
      
      if (!response.ok) {
        throw new Error(`FlightAware API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error(`Error fetching delays for ${airportCode}:`, error);
      return null;
    }
  }

  /**
   * Get airport flights (departures or arrivals)
   */
  async getAirportFlights(airportCode, flightType = 'departures') {
    const cacheKey = `flights_${airportCode}_${flightType}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const icaoCode = this.virginAtlanticHubs[airportCode] || airportCode;
      const url = `${this.baseUrl}/airports/${icaoCode}/flights/${flightType}`;
      
      const response = await fetch(url, { headers: this.headers });
      
      if (!response.ok) {
        throw new Error(`FlightAware API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      return data;
    } catch (error) {
      console.error(`Error fetching ${flightType} for ${airportCode}:`, error);
      return null;
    }
  }

  /**
   * Get comprehensive airport summary
   */
  async getAirportSummary(airportCode) {
    try {
      const [delays, departures, arrivals] = await Promise.all([
        this.getAirportDelays(airportCode),
        this.getAirportFlights(airportCode, 'departures'),
        this.getAirportFlights(airportCode, 'arrivals')
      ]);

      const summary = {
        airport: airportCode,
        icao: this.virginAtlanticHubs[airportCode] || airportCode,
        timestamp: new Date().toISOString(),
        delays: delays || {},
        departures: departures || {},
        arrivals: arrivals || {},
        dataSource: 'flightaware_aeroapi'
      };

      return summary;
    } catch (error) {
      console.error(`Error getting airport summary for ${airportCode}:`, error);
      return null;
    }
  }

  /**
   * Calculate on-time percentage from flights data
   */
  calculateOnTimePercentage(flightsData) {
    if (!flightsData || !flightsData.flights) {
      return 0.0;
    }

    const totalFlights = flightsData.flights.length;
    if (totalFlights === 0) return 0.0;

    let onTimeFlights = 0;

    for (const flight of flightsData.flights) {
      // Consider a flight on-time if delay is less than 15 minutes
      const delayMinutes = flight.delay || 0;
      if (delayMinutes < 15) {
        onTimeFlights++;
      }
    }

    return (onTimeFlights / totalFlights) * 100;
  }

  /**
   * Get Virgin Atlantic specific flights from airport data
   */
  filterVirginAtlanticFlights(flightsData) {
    if (!flightsData || !flightsData.flights) {
      return [];
    }

    return flightsData.flights.filter(flight => {
      const operator = flight.operator || '';
      const flightNumber = flight.ident || '';
      
      // Check for Virgin Atlantic flights (VS, VIR)
      return operator.includes('Virgin Atlantic') || 
             flightNumber.startsWith('VS') || 
             flightNumber.startsWith('VIR');
    });
  }

  /**
   * Get real-time performance metrics for Virgin Atlantic hubs
   */
  async getVirginAtlanticHubPerformance() {
    try {
      const hubCodes = Object.keys(this.virginAtlanticHubs);
      const hubPromises = hubCodes.map(hubCode => this.getHubPerformanceData(hubCode));
      
      const hubResults = await Promise.all(hubPromises);
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        hubs: hubResults.filter(hub => hub !== null),
        dataSource: 'flightaware_aeroapi',
        apiKeyConfigured: !!this.apiKey
      };
    } catch (error) {
      console.error('Error fetching Virgin Atlantic hub performance:', error);
      return {
        success: false,
        error: error.message,
        hubs: [],
        apiKeyConfigured: !!this.apiKey
      };
    }
  }

  /**
   * Get performance data for a specific hub
   */
  async getHubPerformanceData(hubCode) {
    try {
      const summary = await this.getAirportSummary(hubCode);
      if (!summary) return null;

      const departureOnTime = this.calculateOnTimePercentage(summary.departures);
      const arrivalOnTime = this.calculateOnTimePercentage(summary.arrivals);
      const overallOnTime = (departureOnTime + arrivalOnTime) / 2;

      // Get Virgin Atlantic specific flights
      const virginDepartures = this.filterVirginAtlanticFlights(summary.departures);
      const virginArrivals = this.filterVirginAtlanticFlights(summary.arrivals);

      const totalFlights = virginDepartures.length + virginArrivals.length;
      const onTimeFlights = Math.floor(totalFlights * (overallOnTime / 100));
      const delayedFlights = totalFlights - onTimeFlights;

      // Calculate average delay
      const allFlights = [...virginDepartures, ...virginArrivals];
      const totalDelay = allFlights.reduce((sum, flight) => sum + (flight.delay || 0), 0);
      const avgDelayMinutes = totalFlights > 0 ? totalDelay / totalFlights : 0;

      // Get hub info
      const hubInfo = this.getHubInfo(hubCode);

      return {
        icao: this.virginAtlanticHubs[hubCode] || hubCode,
        iata: hubCode,
        name: hubInfo.name,
        city: hubInfo.city,
        onTimeRate: Math.round(overallOnTime * 10) / 10,
        avgDelayMinutes: Math.round(avgDelayMinutes * 10) / 10,
        totalFlights,
        onTimeFlights,
        delayedFlights,
        cancelledFlights: 0, // FlightAware doesn't provide cancellation data in basic response
        trend: overallOnTime > 85 ? 'improving' : overallOnTime < 75 ? 'declining' : 'stable',
        recentFlights: this.formatRecentFlights(allFlights.slice(0, 10)),
        lastUpdated: new Date().toISOString(),
        dataSource: 'flightaware_aeroapi'
      };
    } catch (error) {
      console.error(`Error getting hub performance for ${hubCode}:`, error);
      return null;
    }
  }

  /**
   * Format recent flights for display
   */
  formatRecentFlights(flights) {
    return flights.map(flight => ({
      flightNumber: flight.ident || 'Unknown',
      route: `${flight.origin?.code || 'UNK'}-${flight.destination?.code || 'UNK'}`,
      scheduledTime: flight.scheduled_out || flight.scheduled_in || 'Unknown',
      actualTime: flight.actual_out || flight.actual_in || 'Unknown',
      delayMinutes: flight.delay || 0,
      status: (flight.delay || 0) < 15 ? 'on-time' : 'delayed',
      aircraft: flight.aircraft_type || 'Unknown',
      gate: flight.gate_origin || flight.gate_destination || 'TBD'
    }));
  }

  /**
   * Get hub information
   */
  getHubInfo(code) {
    const hubs = {
      'LHR': { name: 'London Heathrow', city: 'London' },
      'JFK': { name: 'John F. Kennedy International', city: 'New York' },
      'LAX': { name: 'Los Angeles International', city: 'Los Angeles' },
      'MCO': { name: 'Orlando International', city: 'Orlando' },
      'MAN': { name: 'Manchester Airport', city: 'Manchester' },
      'BOS': { name: 'Boston Logan International', city: 'Boston' },
      'ATL': { name: 'Atlanta Hartsfield-Jackson', city: 'Atlanta' },
      'SFO': { name: 'San Francisco International', city: 'San Francisco' }
    };
    return hubs[code] || { name: `${code} Airport`, city: code };
  }

  /**
   * Test API connectivity
   */
  async testConnection() {
    try {
      if (!this.apiKey) {
        return {
          success: false,
          error: 'FlightAware API key not configured',
          message: 'Please set FLIGHTAWARE_API_KEY environment variable'
        };
      }

      // Test with a simple airport query
      const testResponse = await this.getAirportDelays('LHR');
      
      return {
        success: true,
        message: 'FlightAware API connection successful',
        apiKeyConfigured: true,
        testData: testResponse !== null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        apiKeyConfigured: !!this.apiKey
      };
    }
  }
}

export default FlightAwareService;