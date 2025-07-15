/**
 * FAA NAS Status Service for AINO Platform
 * Real-time National Airspace System operational data integration
 * Provides airport events, delays, closures, and forecast information
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';

class FAAStatusService {
  constructor() {
    this.baseUrl = 'https://nasstatus.faa.gov';
    this.cache = new Map();
    this.cacheTimeout = 180000; // 3 minutes cache
    
    // Virgin Atlantic destination airports to monitor
    this.monitoredAirports = [
      'JFK', 'LGA', 'EWR', // New York area
      'BOS', // Boston
      'LAX', // Los Angeles  
      'SFO', // San Francisco
      'MCO', // Orlando
      'MIA', // Miami
      'ATL', // Atlanta
      'IAD', 'DCA', 'BWI', // Washington DC area
      'SEA', // Seattle
      'LAS', // Las Vegas
      'TPA', // Tampa
      'PHL', // Philadelphia
      'ORD', 'MDW', // Chicago
      'DEN', // Denver
      'IAH', 'HOU', // Houston
      'DFW', 'DAL', // Dallas
      'PHX', // Phoenix
      'MSP', // Minneapolis
      'CLT', // Charlotte
      'PBI', 'FLL' // South Florida
    ];
  }

  /**
   * Get comprehensive FAA NAS Status data
   */
  async getFAAStatus() {
    const cacheKey = 'faa_status';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    try {
      const response = await fetch(`${this.baseUrl}/list`, {
        headers: {
          'User-Agent': 'AINO Aviation Intelligence Platform',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
        },
        timeout: 10000
      });

      if (!response.ok) {
        throw new Error(`FAA Status API error: ${response.status}`);
      }

      const html = await response.text();
      const $ = cheerio.load(html);
      
      const airportEvents = this.parseAirportEvents($);
      const enRouteEvents = this.parseEnRouteEvents($);
      const forecastEvents = this.parseForecastEvents($);
      const virginAtlanticImpact = this.analyzeVirginAtlanticImpact(airportEvents, forecastEvents);

      const statusData = {
        timestamp: new Date().toISOString(),
        dataSource: 'FAA NAS Status - nasstatus.faa.gov',
        airportEvents,
        enRouteEvents,
        forecastEvents,
        virginAtlanticImpact,
        summary: this.generateSummary(airportEvents, enRouteEvents, forecastEvents),
        monitoredAirports: this.monitoredAirports.length
      };

      this.cache.set(cacheKey, { data: statusData, timestamp: Date.now() });
      return statusData;

    } catch (error) {
      console.error('Error fetching FAA Status:', error);
      return this.getFallbackData();
    }
  }

  /**
   * Parse active airport events from FAA data
   */
  parseAirportEvents($) {
    const events = [];
    
    // Find the airport events table
    $('#main-content table').first().find('tbody tr').each((i, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 6) {
        const airport = $(cells[0]).text().trim();
        const eventType = $(cells[2]).text().trim();
        const eventTime = $(cells[3]).text().trim();
        const avgDelay = $(cells[4]).text().trim();
        const reason = $(cells[5]).text().trim();
        const scope = $(cells[6]).text().trim();
        
        if (airport && eventType) {
          events.push({
            airport: airport,
            eventType: eventType,
            eventTime: eventTime,
            avgDelay: avgDelay || null,
            reason: reason || 'Not specified',
            scope: scope || 'Not specified',
            isVirginAtlanticDestination: this.monitoredAirports.includes(airport),
            severity: this.calculateEventSeverity(eventType, avgDelay),
            impact: this.calculateVirginAtlanticImpact(airport, eventType, avgDelay)
          });
        }
      }
    });

    return events;
  }

  /**
   * Parse en route events from FAA data
   */
  parseEnRouteEvents($) {
    const events = [];
    
    // Look for en route events section
    const enRouteSection = $('h2:contains("Active En Route Events")').next();
    
    if (enRouteSection.text().includes('No active en route events')) {
      return events;
    }

    enRouteSection.find('table tbody tr').each((i, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 3) {
        events.push({
          eventType: $(cells[0]).text().trim(),
          description: $(cells[1]).text().trim(),
          time: $(cells[2]).text().trim(),
          impact: 'En Route Operations'
        });
      }
    });

    return events;
  }

  /**
   * Parse forecast events from FAA data
   */
  parseForecastEvents($) {
    const events = [];
    
    // Find forecast events table
    $('h2:contains("Forecast Events")').next('table').find('tbody tr').each((i, row) => {
      const $row = $(row);
      const cells = $row.find('td');
      
      if (cells.length >= 2) {
        const time = $(cells[0]).text().trim();
        const event = $(cells[1]).text().trim();
        
        if (time && event) {
          events.push({
            time: time,
            event: event,
            airports: this.extractAirportsFromEvent(event),
            severity: this.assessForecastSeverity(event),
            virginAtlanticRelevance: this.assessVirginAtlanticRelevance(event)
          });
        }
      }
    });

    return events;
  }

  /**
   * Extract airport codes from forecast event text
   */
  extractAirportsFromEvent(eventText) {
    const airports = [];
    this.monitoredAirports.forEach(airport => {
      if (eventText.includes(airport)) {
        airports.push(airport);
      }
    });
    return airports;
  }

  /**
   * Calculate event severity
   */
  calculateEventSeverity(eventType, avgDelay) {
    if (eventType.includes('Closure')) return 'CRITICAL';
    if (eventType.includes('Ground Stop')) return 'HIGH';
    if (eventType.includes('Ground Delay')) return 'HIGH';
    if (eventType.includes('Departure Delay')) {
      if (avgDelay && parseInt(avgDelay) > 30) return 'MEDIUM';
      return 'LOW';
    }
    return 'LOW';
  }

  /**
   * Assess forecast event severity
   */
  assessForecastSeverity(event) {
    if (event.includes('GROUND STOP')) return 'HIGH';
    if (event.includes('DELAY PROGRAM')) return 'MEDIUM';
    if (event.includes('POSSIBLE')) return 'LOW';
    if (event.includes('PROBABLE')) return 'MEDIUM';
    if (event.includes('EXPECTED')) return 'HIGH';
    return 'LOW';
  }

  /**
   * Calculate Virgin Atlantic operational impact
   */
  calculateVirginAtlanticImpact(airport, eventType, avgDelay) {
    if (!this.monitoredAirports.includes(airport)) {
      return { level: 'NONE', description: 'No Virgin Atlantic operations' };
    }

    const isHubAirport = ['JFK', 'LHR', 'MAN', 'LAX', 'BOS', 'MCO', 'MIA', 'ATL', 'SEA', 'LAS'].includes(airport);
    
    if (eventType.includes('Closure')) {
      return {
        level: isHubAirport ? 'CRITICAL' : 'HIGH',
        description: `Airport closure affecting Virgin Atlantic ${isHubAirport ? 'hub' : 'destination'} operations`
      };
    }

    if (eventType.includes('Ground Delay')) {
      const delayMinutes = avgDelay ? parseInt(avgDelay.replace(/\D/g, '')) : 0;
      if (delayMinutes > 60) {
        return {
          level: 'HIGH',
          description: `Significant ground delays (${delayMinutes}min) affecting Virgin Atlantic operations`
        };
      } else if (delayMinutes > 30) {
        return {
          level: 'MEDIUM',
          description: `Moderate ground delays (${delayMinutes}min) affecting Virgin Atlantic operations`
        };
      }
    }

    return {
      level: 'LOW',
      description: 'Minor impact on Virgin Atlantic operations'
    };
  }

  /**
   * Assess Virgin Atlantic relevance for forecast events
   */
  assessVirginAtlanticRelevance(event) {
    const relevantAirports = this.extractAirportsFromEvent(event);
    if (relevantAirports.length === 0) return 'NONE';
    
    const hubAirports = relevantAirports.filter(apt => 
      ['JFK', 'LHR', 'MAN', 'LAX', 'BOS', 'MCO', 'MIA', 'ATL', 'SEA', 'LAS'].includes(apt)
    );
    
    if (hubAirports.length > 0) return 'HIGH';
    if (relevantAirports.length > 0) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Analyze overall Virgin Atlantic impact
   */
  analyzeVirginAtlanticImpact(airportEvents, forecastEvents) {
    const currentImpacts = airportEvents
      .filter(event => event.isVirginAtlanticDestination)
      .map(event => ({
        airport: event.airport,
        eventType: event.eventType,
        severity: event.severity,
        impact: event.impact
      }));

    const forecastImpacts = forecastEvents
      .filter(event => event.virginAtlanticRelevance !== 'NONE')
      .map(event => ({
        time: event.time,
        event: event.event,
        airports: event.airports,
        severity: event.severity,
        relevance: event.virginAtlanticRelevance
      }));

    const overallRisk = this.calculateOverallRisk(currentImpacts, forecastImpacts);

    return {
      currentImpacts,
      forecastImpacts,
      overallRisk,
      recommendations: this.generateRecommendations(currentImpacts, forecastImpacts, overallRisk)
    };
  }

  /**
   * Calculate overall operational risk level
   */
  calculateOverallRisk(currentImpacts, forecastImpacts) {
    let riskScore = 0;
    
    currentImpacts.forEach(impact => {
      switch (impact.severity) {
        case 'CRITICAL': riskScore += 4; break;
        case 'HIGH': riskScore += 3; break;
        case 'MEDIUM': riskScore += 2; break;
        case 'LOW': riskScore += 1; break;
      }
    });

    forecastImpacts.forEach(impact => {
      switch (impact.severity) {
        case 'HIGH': riskScore += 2; break;
        case 'MEDIUM': riskScore += 1; break;
        case 'LOW': riskScore += 0.5; break;
      }
    });

    if (riskScore >= 6) return 'CRITICAL';
    if (riskScore >= 4) return 'HIGH';
    if (riskScore >= 2) return 'MEDIUM';
    if (riskScore > 0) return 'LOW';
    return 'NORMAL';
  }

  /**
   * Generate operational recommendations
   */
  generateRecommendations(currentImpacts, forecastImpacts, overallRisk) {
    const recommendations = [];

    if (overallRisk === 'CRITICAL' || overallRisk === 'HIGH') {
      recommendations.push('Activate enhanced operational monitoring');
      recommendations.push('Prepare passenger rebooking protocols');
      recommendations.push('Coordinate with ground handling partners');
    }

    currentImpacts.forEach(impact => {
      if (impact.severity === 'CRITICAL') {
        recommendations.push(`IMMEDIATE: Address ${impact.airport} ${impact.eventType.toLowerCase()}`);
      }
    });

    forecastImpacts.forEach(impact => {
      if (impact.severity === 'HIGH' && impact.airports.length > 0) {
        recommendations.push(`PREPARE: Monitor ${impact.airports.join(', ')} for ${impact.event.toLowerCase()}`);
      }
    });

    return recommendations.length > 0 ? recommendations : ['Normal operations - continue standard monitoring'];
  }

  /**
   * Generate operational summary
   */
  generateSummary(airportEvents, enRouteEvents, forecastEvents) {
    const activeEvents = airportEvents.length;
    const criticalEvents = airportEvents.filter(e => e.severity === 'CRITICAL').length;
    const virginAtlanticAffected = airportEvents.filter(e => e.isVirginAtlanticDestination).length;
    const forecastCount = forecastEvents.length;

    return {
      activeEvents,
      criticalEvents,
      virginAtlanticAffected,
      forecastCount,
      status: criticalEvents > 0 ? 'DISRUPTED' : virginAtlanticAffected > 0 ? 'IMPACTED' : 'NORMAL'
    };
  }

  /**
   * Get fallback data when service is unavailable
   */
  getFallbackData() {
    return {
      timestamp: new Date().toISOString(),
      dataSource: 'FAA NAS Status - Fallback Data',
      airportEvents: [],
      enRouteEvents: [],
      forecastEvents: [],
      virginAtlanticImpact: {
        currentImpacts: [],
        forecastImpacts: [],
        overallRisk: 'UNKNOWN',
        recommendations: ['FAA Status service temporarily unavailable - using fallback monitoring']
      },
      summary: {
        activeEvents: 0,
        criticalEvents: 0,
        virginAtlanticAffected: 0,
        forecastCount: 0,
        status: 'UNKNOWN'
      },
      monitoredAirports: this.monitoredAirports.length,
      fallback: true
    };
  }

  /**
   * Get Virgin Atlantic specific alerts
   */
  async getVirginAtlanticAlerts() {
    try {
      const statusData = await this.getFAAStatus();
      
      const alerts = [];
      
      statusData.airportEvents.forEach(event => {
        if (event.isVirginAtlanticDestination && event.severity !== 'LOW') {
          alerts.push({
            type: 'AIRPORT_EVENT',
            severity: event.severity,
            airport: event.airport,
            message: `${event.eventType} at ${event.airport}: ${event.reason}`,
            impact: event.impact.description || 'Operational impact',
            timestamp: new Date().toISOString()
          });
        }
      });

      statusData.forecastEvents.forEach(event => {
        if (event.virginAtlanticRelevance === 'HIGH') {
          alerts.push({
            type: 'FORECAST_EVENT',
            severity: event.severity,
            airports: event.airports,
            message: `Forecast: ${event.event} at ${event.time}`,
            impact: `Potential impact on ${event.airports.join(', ')} operations`,
            timestamp: new Date().toISOString()
          });
        }
      });

      return {
        success: true,
        alerts,
        alertCount: alerts.length,
        overallRisk: statusData.virginAtlanticImpact.overallRisk,
        timestamp: statusData.timestamp
      };

    } catch (error) {
      return {
        success: false,
        error: error.message,
        alerts: [],
        alertCount: 0,
        overallRisk: 'UNKNOWN',
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Test service connectivity
   */
  async testConnection() {
    try {
      const response = await fetch(`${this.baseUrl}/list`, {
        method: 'HEAD',
        timeout: 5000
      });
      
      return {
        success: response.ok,
        status: response.status,
        message: response.ok ? 'FAA NAS Status service operational' : 'Service unavailable'
      };
    } catch (error) {
      return {
        success: false,
        status: 0,
        message: `Connection failed: ${error.message}`
      };
    }
  }
}

export default FAAStatusService;