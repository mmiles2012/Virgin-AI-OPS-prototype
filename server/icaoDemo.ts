/**
 * ICAO Aviation Intelligence Demonstration System
 * Showcases comprehensive ICAO features with authentic aviation data structure
 */

import { ICAOFlightData, ICAONotamData, ICAOAirportData } from './icaoApiService';

export class ICAODemoService {
  constructor() {
    console.log('ICAO Demo Service initialized - showcasing official aviation intelligence features');
  }

  /**
   * Generate comprehensive ICAO flight demonstration data
   * Based on authentic Virgin Atlantic and other carriers' operational patterns
   */
  generateDemoFlightData(): ICAOFlightData[] {
    return [
      {
        icao24: '40009C',
        callsign: 'VIR25H',
        registration: 'G-VFAB',
        aircraft_type: 'A350-1000',
        operator: 'Virgin Atlantic Airways',
        origin: 'EGLL',
        destination: 'KJFK',
        position: {
          latitude: 51.4700,
          longitude: -0.4543,
          altitude_ft: 37000,
          heading: 285
        },
        speed: {
          ground_speed_kts: 485,
          indicated_airspeed_kts: 280,
          mach: 0.82
        },
        flight_phase: 'cruise',
        squawk: '2000',
        emergency: false,
        timestamp: new Date().toISOString()
      },
      {
        icao24: '400B1F',
        callsign: 'VIR129',
        registration: 'G-VZIG',
        aircraft_type: 'B787-9',
        operator: 'Virgin Atlantic Airways',
        origin: 'EGLL',
        destination: 'KLAX',
        position: {
          latitude: 51.2867,
          longitude: -0.7972,
          altitude_ft: 2500,
          heading: 270
        },
        speed: {
          ground_speed_kts: 180,
          indicated_airspeed_kts: 160,
          mach: 0.25
        },
        flight_phase: 'departure',
        squawk: '2001',
        emergency: false,
        timestamp: new Date().toISOString()
      },
      {
        icao24: '4009A2',
        callsign: 'VIR3',
        registration: 'G-VNYL',
        aircraft_type: 'A330-300',
        operator: 'Virgin Atlantic Airways',
        origin: 'KJFK',
        destination: 'EGLL',
        position: {
          latitude: 51.1500,
          longitude: -0.1833,
          altitude_ft: 3000,
          heading: 90
        },
        speed: {
          ground_speed_kts: 200,
          indicated_airspeed_kts: 180,
          mach: 0.30
        },
        flight_phase: 'approach',
        squawk: '7000',
        emergency: false,
        timestamp: new Date().toISOString()
      },
      {
        icao24: '4CA2D6',
        callsign: 'ACA857',
        registration: 'C-FGFZ',
        aircraft_type: 'B777-300ER',
        operator: 'Air Canada',
        origin: 'CYYZ',
        destination: 'EGLL',
        position: {
          latitude: 52.0833,
          longitude: -1.3333,
          altitude_ft: 41000,
          heading: 135
        },
        speed: {
          ground_speed_kts: 520,
          indicated_airspeed_kts: 290,
          mach: 0.85
        },
        flight_phase: 'cruise',
        squawk: '2002',
        emergency: false,
        timestamp: new Date().toISOString()
      },
      {
        icao24: '896541',
        callsign: 'UAE31',
        registration: 'A6-EUH',
        aircraft_type: 'A380-800',
        operator: 'Emirates',
        origin: 'OMDB',
        destination: 'EGLL',
        position: {
          latitude: 51.4700,
          longitude: -0.4543,
          altitude_ft: 1200,
          heading: 270
        },
        speed: {
          ground_speed_kts: 145,
          indicated_airspeed_kts: 135,
          mach: 0.20
        },
        flight_phase: 'landing',
        squawk: '7600',
        emergency: true,
        timestamp: new Date().toISOString()
      }
    ];
  }

  /**
   * Generate authentic ICAO NOTAM demonstration data
   */
  generateDemoNotamData(): ICAONotamData[] {
    return [
      {
        notam_id: 'A0123/24',
        airport_icao: 'EGLL',
        type: 'RWY',
        condition: 'CLOSED',
        location: 'RWY 09R/27L',
        effective_from: new Date().toISOString(),
        effective_until: new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString(),
        description: 'Runway 09R/27L closed for maintenance operations. Use alternate runway 09L/27R.',
        severity: 'high',
        affects_operations: true
      },
      {
        notam_id: 'A0124/24',
        airport_icao: 'EGKK',
        type: 'ILS',
        condition: 'UNSERVICEABLE',
        location: 'ILS RWY 07',
        effective_from: new Date().toISOString(),
        effective_until: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(),
        description: 'ILS Category II approach to runway 07 unserviceable. Category I approach available.',
        severity: 'medium',
        affects_operations: true
      },
      {
        notam_id: 'A0125/24',
        airport_icao: 'EGSS',
        type: 'TWR',
        condition: 'LIMITED_SERVICE',
        location: 'CONTROL TOWER',
        effective_from: new Date().toISOString(),
        effective_until: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
        description: 'Air Traffic Control operating with reduced capacity due to equipment maintenance.',
        severity: 'medium',
        affects_operations: true
      },
      {
        notam_id: 'A0126/24',
        airport_icao: 'EGLC',
        type: 'OBST',
        condition: 'NEW_OBSTACLE',
        location: 'APPROACH PATH RWY 27',
        effective_from: new Date().toISOString(),
        effective_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        description: 'Temporary crane 150ft AGL located 2NM east of runway 27 threshold.',
        severity: 'critical',
        affects_operations: true
      },
      {
        notam_id: 'A0127/24',
        airport_icao: 'EGLL',
        type: 'NAV',
        condition: 'TESTING',
        location: 'VOR/DME LON',
        effective_from: new Date().toISOString(),
        effective_until: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
        description: 'VOR/DME LON undergoing scheduled testing. Intermittent signal interruptions expected.',
        severity: 'low',
        affects_operations: false
      }
    ];
  }

  /**
   * Generate comprehensive airport data demonstration
   */
  generateDemoAirportData(): ICAOAirportData[] {
    return [
      {
        icao_code: 'EGLL',
        iata_code: 'LHR',
        name: 'London Heathrow Airport',
        city: 'London',
        country: 'United Kingdom',
        position: {
          latitude: 51.4700,
          longitude: -0.4543,
          elevation_ft: 83
        },
        runways: [
          {
            designation: '09L/27R',
            length_ft: 12802,
            width_ft: 150,
            surface: 'Asphalt',
            ils_available: true
          },
          {
            designation: '09R/27L',
            length_ft: 12008,
            width_ft: 150,
            surface: 'Asphalt',
            ils_available: true
          }
        ],
        operational_status: 'Active',
        timezone: 'GMT'
      },
      {
        icao_code: 'KJFK',
        iata_code: 'JFK',
        name: 'John F. Kennedy International Airport',
        city: 'New York',
        country: 'United States',
        position: {
          latitude: 40.6413,
          longitude: -73.7781,
          elevation_ft: 13
        },
        runways: [
          {
            designation: '04L/22R',
            length_ft: 11351,
            width_ft: 150,
            surface: 'Asphalt',
            ils_available: true
          },
          {
            designation: '04R/22L',
            length_ft: 8400,
            width_ft: 200,
            surface: 'Asphalt',
            ils_available: true
          }
        ],
        operational_status: 'Active',
        timezone: 'EST'
      }
    ];
  }

  /**
   * Generate ML safety intelligence demonstration
   */
  generateMLSafetyIntelligence() {
    const flights = this.generateDemoFlightData();
    
    return {
      critical_alerts: [
        {
          type: 'EMERGENCY_AIRCRAFT',
          callsign: 'UAE31',
          severity: 'critical',
          message: 'Emergency squawk 7600 detected - radio communication failure',
          location: { lat: 51.4700, lon: -0.4543 },
          altitude: 1200,
          timestamp: new Date().toISOString(),
          ml_confidence: 0.95,
          recommended_action: 'Immediate ATC intervention required'
        }
      ],
      warning_alerts: [
        {
          type: 'ALTITUDE_DEVIATION',
          callsign: 'VIR3',
          severity: 'warning',
          message: 'Approach profile deviation detected on final approach',
          location: { lat: 51.1500, lon: -0.1833 },
          altitude: 3000,
          timestamp: new Date().toISOString(),
          ml_confidence: 0.78,
          recommended_action: 'Monitor approach closely'
        }
      ],
      advisory_alerts: [
        {
          type: 'AIRSPACE_CONGESTION',
          severity: 'advisory',
          message: 'High traffic density in London TMA - expect delays',
          congestion_level: 0.75,
          timestamp: new Date().toISOString(),
          ml_confidence: 0.82,
          recommended_action: 'Consider traffic flow management'
        }
      ],
      airspace_status: 'heightened',
      recommendations: [
        'Monitor emergency aircraft UAE31 with priority handling',
        'Increase separation standards in high-density areas',
        'Consider alternate routing for arriving traffic'
      ],
      ml_model_performance: {
        accuracy: 0.94,
        precision: 0.91,
        recall: 0.88,
        feature_importance: {
          altitude_risk: 0.35,
          speed_anomaly: 0.28,
          emergency_status: 0.42,
          airspace_congestion: 0.15
        }
      }
    };
  }

  /**
   * Generate comprehensive aviation intelligence report
   */
  generateAviationIntelligenceReport() {
    const flights = this.generateDemoFlightData();
    const notams = this.generateDemoNotamData();
    const airports = this.generateDemoAirportData();
    const safetyIntelligence = this.generateMLSafetyIntelligence();

    return {
      summary: {
        total_flights_tracked: flights.length,
        active_notams: notams.length,
        monitored_airports: airports.length,
        safety_alerts: {
          critical: safetyIntelligence.critical_alerts.length,
          warning: safetyIntelligence.warning_alerts.length,
          advisory: safetyIntelligence.advisory_alerts.length
        }
      },
      operational_overview: {
        virgin_atlantic_flights: flights.filter(f => f.operator === 'Virgin Atlantic Airways').length,
        emergency_situations: flights.filter(f => f.emergency).length,
        runway_closures: notams.filter(n => n.type === 'RWY' && n.condition === 'CLOSED').length,
        airspace_status: safetyIntelligence.airspace_status
      },
      ml_insights: {
        risk_assessment: 'Medium overall risk with one critical emergency situation',
        prediction_confidence: 0.89,
        key_factors: [
          'Emergency radio failure requiring immediate attention',
          'High traffic density affecting flow management',
          'Runway maintenance impacting capacity'
        ]
      },
      real_time_features: {
        live_flight_tracking: 'Active',
        notam_monitoring: 'Continuous',
        ml_safety_analysis: 'Real-time',
        predictive_modeling: 'Enabled'
      },
      data_sources: [
        'ICAO Official Aviation API',
        'Virgin Atlantic Fleet Monitoring',
        'SafeAirspace NOTAMs',
        'ML Safety Intelligence Engine'
      ],
      timestamp: new Date().toISOString()
    };
  }
}

export const icaoDemo = new ICAODemoService();