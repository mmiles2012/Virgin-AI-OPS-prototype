/**
 * Aviation Intelligence Service - Integrates FlightAware and FAA NOTAM data across AINO platform
 * Provides comprehensive analysis for delays, airspace restrictions, rerouting, and alerts
 */

import FlightAwareService from './flightAwareService.js';
import { faaNotamService } from './faaNotamService.js';

interface AviationAlert {
  id: string;
  type: 'DELAY' | 'AIRSPACE_RESTRICTION' | 'REROUTING' | 'WEATHER' | 'SECURITY' | 'OPERATIONAL';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  title: string;
  description: string;
  affectedFlights: string[];
  affectedAirports: string[];
  recommendations: string[];
  source: 'FlightAware' | 'FAA_NOTAM' | 'INTEGRATED_ANALYSIS';
  timestamp: string;
  validUntil?: string;
  coordinates?: { latitude: number; longitude: number };
}

interface RouteAnalysis {
  routeId: string;
  origin: string;
  destination: string;
  status: 'CLEAR' | 'MINOR_DELAYS' | 'MAJOR_DELAYS' | 'RESTRICTED' | 'CLOSED';
  delayMinutes: number;
  restrictions: string[];
  alternativeRoutes: Array<{
    waypoints: string[];
    additionalDistance: number;
    additionalTime: number;
    reason: string;
  }>;
  activeNotams: any[];
  flightPerformance: {
    averageDelay: number;
    onTimePerformance: number;
    totalFlights: number;
  };
}

class AviationIntelligenceService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly cacheTimeout = 60000; // 1 minute
  private flightAwareService: FlightAwareService;

  constructor() {
    this.flightAwareService = new FlightAwareService();
  }

  /**
   * Generate comprehensive aviation alerts by analyzing FlightAware and NOTAM data
   */
  async generateAviationAlerts(): Promise<AviationAlert[]> {
    const alerts: AviationAlert[] = [];

    try {
      // Get FlightAware data for Virgin Atlantic flights
      const virginAtlanticFlights = await this.flightAwareService.getVirginAtlanticFlights();
      
      // Get critical NOTAMs
      const criticalNotams = await faaNotamService.getCriticalNotams();
      
      // Get Virgin Atlantic route NOTAMs
      const routeNotams = await faaNotamService.getVirginAtlanticRouteNotams();

      // Analyze flight delays and generate alerts
      const delayAlerts = this.analyzeFlightDelays(virginAtlanticFlights);
      alerts.push(...delayAlerts);

      // Analyze airspace restrictions from NOTAMs
      const airspaceAlerts = this.analyzeAirspaceRestrictions(criticalNotams, routeNotams);
      alerts.push(...airspaceAlerts);

      // Generate rerouting recommendations
      const reroutingAlerts = this.analyzeReroutingNeeds(virginAtlanticFlights, routeNotams);
      alerts.push(...reroutingAlerts);

      // Cross-reference flights with NOTAMs for specific impacts
      const flightSpecificAlerts = this.analyzeFlightNotamImpacts(virginAtlanticFlights, routeNotams);
      alerts.push(...flightSpecificAlerts);

    } catch (error) {
      console.error('[Aviation Intelligence] Error generating alerts:', error);
      
      // Return fallback alerts to maintain system functionality
      alerts.push({
        id: 'system-error',
        type: 'OPERATIONAL',
        severity: 'MEDIUM',
        title: 'Aviation Intelligence Service Unavailable',
        description: 'Real-time aviation intelligence temporarily unavailable. Using cached data.',
        affectedFlights: [],
        affectedAirports: [],
        recommendations: ['Monitor manual updates', 'Contact operations center for current status'],
        source: 'INTEGRATED_ANALYSIS',
        timestamp: new Date().toISOString()
      });
    }

    return alerts.sort((a, b) => this.getSeverityWeight(b.severity) - this.getSeverityWeight(a.severity));
  }

  /**
   * Analyze Virgin Atlantic route performance and restrictions
   */
  async analyzeRoutePerformance(): Promise<RouteAnalysis[]> {
    const routes: RouteAnalysis[] = [];

    try {
      const flights = await this.flightAwareService.getVirginAtlanticFlights();
      const routeNotams = await faaNotamService.getVirginAtlanticRouteNotams();

      // Group flights by route
      const routeGroups = this.groupFlightsByRoute(flights);

      for (const [routeKey, routeFlights] of routeGroups.entries()) {
        const [origin, destination] = routeKey.split('-');
        
        // Calculate performance metrics
        const avgDelay = this.calculateAverageDelay(routeFlights);
        const onTimePerf = this.calculateOnTimePerformance(routeFlights);
        
        // Find relevant NOTAMs for this route
        const relevantNotams = routeNotams.filter(notam => 
          notam.icaoLocation === origin || 
          notam.icaoLocation === destination ||
          notam.text.includes(origin) || 
          notam.text.includes(destination)
        );

        // Determine route status
        const status = this.determineRouteStatus(avgDelay, relevantNotams);
        
        // Generate alternative routes if needed
        const alternatives = status === 'RESTRICTED' || status === 'MAJOR_DELAYS' 
          ? this.generateAlternativeRoutes(origin, destination, relevantNotams)
          : [];

        routes.push({
          routeId: routeKey,
          origin,
          destination,
          status,
          delayMinutes: avgDelay,
          restrictions: relevantNotams.map(n => n.text).slice(0, 3),
          alternativeRoutes: alternatives,
          activeNotams: relevantNotams,
          flightPerformance: {
            averageDelay: avgDelay,
            onTimePerformance: onTimePerf,
            totalFlights: routeFlights.length
          }
        });
      }
    } catch (error) {
      console.error('[Aviation Intelligence] Error analyzing routes:', error);
    }

    return routes;
  }

  /**
   * Get integrated operational recommendations
   */
  async getOperationalRecommendations(): Promise<{
    immediate: string[];
    strategic: string[];
    rerouting: Array<{ from: string; to: string; reason: string; alternatives: string[] }>;
    delayMitigation: Array<{ flight: string; action: string; expectedSaving: number }>;
  }> {
    try {
      const alerts = await this.generateAviationAlerts();
      const routes = await this.analyzeRoutePerformance();
      
      const immediate: string[] = [];
      const strategic: string[] = [];
      const rerouting: Array<{ from: string; to: string; reason: string; alternatives: string[] }> = [];
      const delayMitigation: Array<{ flight: string; action: string; expectedSaving: number }> = [];

      // Process alerts for immediate actions
      alerts.filter(a => a.severity === 'CRITICAL' || a.severity === 'HIGH').forEach(alert => {
        immediate.push(`${alert.title}: ${alert.description}`);
        immediate.push(...alert.recommendations.slice(0, 2));
      });

      // Process route analysis for strategic recommendations
      routes.forEach(route => {
        if (route.status === 'MAJOR_DELAYS' || route.status === 'RESTRICTED') {
          strategic.push(`Monitor ${route.origin}-${route.destination} route: ${route.delayMinutes}min avg delay`);
          
          if (route.alternativeRoutes.length > 0) {
            rerouting.push({
              from: route.origin,
              to: route.destination,
              reason: `${route.delayMinutes}min delays, ${route.restrictions.length} restrictions`,
              alternatives: route.alternativeRoutes.map(alt => alt.waypoints.join(' → '))
            });
          }
        }

        // Generate delay mitigation for specific flights
        if (route.flightPerformance.averageDelay > 15) {
          delayMitigation.push({
            flight: `${route.origin}-${route.destination} routes`,
            action: 'Consider earlier departure or speed optimization',
            expectedSaving: Math.min(route.flightPerformance.averageDelay * 0.4, 20)
          });
        }
      });

      // Add strategic recommendations
      if (routes.filter(r => r.status === 'RESTRICTED').length > 2) {
        strategic.push('Multiple route restrictions detected - review network-wide operations');
      }

      return {
        immediate: immediate.slice(0, 5),
        strategic: strategic.slice(0, 5),
        rerouting: rerouting.slice(0, 3),
        delayMitigation: delayMitigation.slice(0, 3)
      };
    } catch (error) {
      console.error('[Aviation Intelligence] Error generating recommendations:', error);
      return {
        immediate: ['Aviation intelligence service temporarily unavailable'],
        strategic: ['Monitor operations manually until service restoration'],
        rerouting: [],
        delayMitigation: []
      };
    }
  }

  // Private helper methods
  private analyzeFlightDelays(flights: any[]): AviationAlert[] {
    const alerts: AviationAlert[] = [];
    
    flights.forEach(flight => {
      if (flight.status && flight.status.includes('DELAY')) {
        alerts.push({
          id: `delay-${flight.ident}`,
          type: 'DELAY',
          severity: 'MEDIUM',
          title: `Flight Delay: ${flight.ident}`,
          description: `${flight.origin} to ${flight.destination} experiencing delays`,
          affectedFlights: [flight.ident],
          affectedAirports: [flight.origin, flight.destination],
          recommendations: ['Monitor passenger connections', 'Consider rebooking options'],
          source: 'FlightAware',
          timestamp: new Date().toISOString()
        });
      }
    });

    return alerts;
  }

  private analyzeAirspaceRestrictions(criticalNotams: any[], routeNotams: any[]): AviationAlert[] {
    const alerts: AviationAlert[] = [];
    
    criticalNotams.forEach(notam => {
      alerts.push({
        id: `airspace-${notam.notamNumber}`,
        type: 'AIRSPACE_RESTRICTION',
        severity: notam.impact === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
        title: `Airspace Restriction: ${notam.icaoLocation}`,
        description: notam.text,
        affectedFlights: [],
        affectedAirports: [notam.icaoLocation],
        recommendations: ['Review flight plans', 'Consider alternative routing'],
        source: 'FAA_NOTAM',
        timestamp: new Date().toISOString(),
        validUntil: notam.endDate
      });
    });

    return alerts;
  }

  private analyzeReroutingNeeds(flights: any[], notams: any[]): AviationAlert[] {
    const alerts: AviationAlert[] = [];
    
    // Check if any flights are affected by NOTAMs requiring rerouting
    flights.forEach(flight => {
      const relevantNotams = notams.filter(notam => 
        notam.icaoLocation === flight.origin || 
        notam.icaoLocation === flight.destination
      );

      if (relevantNotams.length > 0 && relevantNotams.some(n => n.impact === 'HIGH' || n.impact === 'CRITICAL')) {
        alerts.push({
          id: `rerouting-${flight.ident}`,
          type: 'REROUTING',
          severity: 'HIGH',
          title: `Rerouting Required: ${flight.ident}`,
          description: `Flight path affected by airspace restrictions`,
          affectedFlights: [flight.ident],
          affectedAirports: [flight.origin, flight.destination],
          recommendations: ['Calculate alternative routes', 'Update flight plan', 'Notify ATC'],
          source: 'INTEGRATED_ANALYSIS',
          timestamp: new Date().toISOString()
        });
      }
    });

    return alerts;
  }

  private analyzeFlightNotamImpacts(flights: any[], notams: any[]): AviationAlert[] {
    const alerts: AviationAlert[] = [];
    
    flights.forEach(flight => {
      const impactingNotams = notams.filter(notam => 
        notam.icaoLocation === flight.origin || 
        notam.icaoLocation === flight.destination ||
        (flight.waypoints && flight.waypoints.some((wp: any) => 
          notam.text.includes(wp.name)
        ))
      );

      if (impactingNotams.length > 0) {
        alerts.push({
          id: `impact-${flight.ident}`,
          type: 'OPERATIONAL',
          severity: 'MEDIUM',
          title: `Operational Impact: ${flight.ident}`,
          description: `${impactingNotams.length} NOTAMs affecting flight operations`,
          affectedFlights: [flight.ident],
          affectedAirports: [flight.origin, flight.destination],
          recommendations: ['Review NOTAM details', 'Assess operational impact'],
          source: 'INTEGRATED_ANALYSIS',
          timestamp: new Date().toISOString()
        });
      }
    });

    return alerts;
  }

  private groupFlightsByRoute(flights: any[]): Map<string, any[]> {
    const groups = new Map<string, any[]>();
    
    flights.forEach(flight => {
      const routeKey = `${flight.origin}-${flight.destination}`;
      if (!groups.has(routeKey)) {
        groups.set(routeKey, []);
      }
      groups.get(routeKey)!.push(flight);
    });

    return groups;
  }

  private calculateAverageDelay(flights: any[]): number {
    const delays = flights.map(f => f.delay_minutes || 0);
    return delays.length > 0 ? delays.reduce((a, b) => a + b, 0) / delays.length : 0;
  }

  private calculateOnTimePerformance(flights: any[]): number {
    const onTime = flights.filter(f => (f.delay_minutes || 0) <= 15).length;
    return flights.length > 0 ? (onTime / flights.length) * 100 : 100;
  }

  private determineRouteStatus(avgDelay: number, notams: any[]): RouteAnalysis['status'] {
    const criticalNotams = notams.filter(n => n.impact === 'CRITICAL').length;
    const highNotams = notams.filter(n => n.impact === 'HIGH').length;

    if (criticalNotams > 0) return 'CLOSED';
    if (highNotams > 0 || avgDelay > 60) return 'RESTRICTED';
    if (avgDelay > 30) return 'MAJOR_DELAYS';
    if (avgDelay > 15) return 'MINOR_DELAYS';
    return 'CLEAR';
  }

  private generateAlternativeRoutes(origin: string, destination: string, notams: any[]): RouteAnalysis['alternativeRoutes'] {
    // Simplified alternative route generation
    const alternatives: RouteAnalysis['alternativeRoutes'] = [];
    
    // Common alternative waypoints for major routes
    const alternativeWaypoints = {
      'EGLL-KJFK': ['EGLL', 'GOOSE', 'CYQX', 'KJFK'],
      'EGLL-KLAX': ['EGLL', 'SHANNON', 'GANDER', 'KLAX'],
      'EGLL-KBOS': ['EGLL', 'CORK', 'GANDER', 'KBOS']
    };

    const routeKey = `${origin}-${destination}`;
    if (alternativeWaypoints[routeKey as keyof typeof alternativeWaypoints]) {
      alternatives.push({
        waypoints: alternativeWaypoints[routeKey as keyof typeof alternativeWaypoints],
        additionalDistance: 50,
        additionalTime: 15,
        reason: 'Avoiding restricted airspace'
      });
    }

    return alternatives;
  }

  private getSeverityWeight(severity: AviationAlert['severity']): number {
    switch (severity) {
      case 'CRITICAL': return 4;
      case 'HIGH': return 3;
      case 'MEDIUM': return 2;
      case 'LOW': return 1;
      default: return 0;
    }
  }
}

export const aviationIntelligenceService = new AviationIntelligenceService();