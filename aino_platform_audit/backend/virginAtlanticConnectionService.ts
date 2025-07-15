import { spawn } from 'child_process';
import path from 'path';

interface VirginAtlanticPassenger {
  passenger_id: string;
  name: string;
  origin_airport: string;
  final_destination: string;
  alliance_status: string;
  connection_type: 'INBOUND_TO_VS' | 'VS_TO_SKYTEAM' | 'SKYTEAM_TO_VS';
  connection_flights: VirginAtlanticConnectionFlight[];
}

interface VirginAtlanticConnectionFlight {
  flight_number: string;
  airline: string;
  alliance: 'Virgin Atlantic' | 'SkyTeam' | 'Star Alliance' | 'OneWorld';
  route: string;
  terminal: string;
  aircraft_type: string;
  real_time_status: {
    flight_id: string;
    current_status: string;
    delay_minutes: number;
    gate?: string;
    last_updated: string;
  };
}

interface VirginAtlanticConnectionAlert {
  type: 'TIGHT_CONNECTION' | 'INBOUND_DELAY' | 'TERMINAL_CHANGE' | 'GATE_CHANGE' | 'VS_SKYTEAM_RISK';
  passenger_id: string;
  passenger_name: string;
  risk_level: 'HIGH' | 'MEDIUM' | 'LOW' | 'CRITICAL';
  timestamp: string;
  vs_flight?: string;
  skyteam_flight?: string;
  connection_details: string;
  recommended_action: string;
}

class VirginAtlanticConnectionService {
  private passengers: Map<string, VirginAtlanticPassenger> = new Map();
  private alerts: VirginAtlanticConnectionAlert[] = [];
  private isMonitoring = false;

  constructor() {
    this.initializeVirginAtlanticPassengers();
    this.startMonitoring();
  }

  private initializeVirginAtlanticPassengers() {
    // Focus on passengers connecting to/from Virgin Atlantic and SkyTeam flights
    const passengers: VirginAtlanticPassenger[] = [
      {
        passenger_id: 'PAX001',
        name: 'John Kimani',
        origin_airport: 'NBO',
        final_destination: 'LAX',
        alliance_status: 'SkyTeam Gold',
        connection_type: 'SKYTEAM_TO_VS',
        connection_flights: [
          {
            flight_number: 'KQ100',
            airline: 'Kenya Airways',
            alliance: 'SkyTeam',
            route: 'NBO → LHR',
            terminal: 'Terminal 4',
            aircraft_type: 'Boeing 787',
            real_time_status: {
              flight_id: 'KQKQ100',
              current_status: 'Delayed',
              delay_minutes: 45,
              gate: '12',
              last_updated: new Date().toISOString()
            }
          },
          {
            flight_number: 'VS24',
            airline: 'Virgin Atlantic',
            alliance: 'Virgin Atlantic',
            route: 'LHR → LAX',
            terminal: 'Terminal 3',
            aircraft_type: 'Airbus A350',
            real_time_status: {
              flight_id: 'VSVS24',
              current_status: 'Scheduled',
              delay_minutes: 0,
              gate: 'A7',
              last_updated: new Date().toISOString()
            }
          }
        ]
      },
      {
        passenger_id: 'PAX002',
        name: 'Priya Sharma',
        origin_airport: 'DEL',
        final_destination: 'JFK',
        alliance_status: 'Virgin Atlantic Gold',
        connection_type: 'VS_TO_SKYTEAM',
        connection_flights: [
          {
            flight_number: 'VS302',
            airline: 'Virgin Atlantic',
            alliance: 'Virgin Atlantic',
            route: 'DEL → LHR',
            terminal: 'Terminal 3',
            aircraft_type: 'Boeing 787',
            real_time_status: {
              flight_id: 'VSVS302',
              current_status: 'Arrived',
              delay_minutes: 15,
              gate: 'A12',
              last_updated: new Date().toISOString()
            }
          },
          {
            flight_number: 'DL106',
            airline: 'Delta Air Lines',
            alliance: 'SkyTeam',
            route: 'LHR → JFK',
            terminal: 'Terminal 3',
            aircraft_type: 'Airbus A330',
            real_time_status: {
              flight_id: 'DLDL106',
              current_status: 'Boarding',
              delay_minutes: 0,
              gate: 'A15',
              last_updated: new Date().toISOString()
            }
          }
        ]
      },
      {
        passenger_id: 'PAX003',
        name: 'Sophie Laurent',
        origin_airport: 'CDG',
        final_destination: 'JFK',
        alliance_status: 'SkyTeam Elite',
        connection_type: 'SKYTEAM_TO_VS',
        connection_flights: [
          {
            flight_number: 'AF1381',
            airline: 'Air France',
            alliance: 'SkyTeam',
            route: 'CDG → LHR',
            terminal: 'Terminal 4',
            aircraft_type: 'Airbus A320',
            real_time_status: {
              flight_id: 'AFAF1381',
              current_status: 'Arrived',
              delay_minutes: 0,
              gate: '7',
              last_updated: new Date().toISOString()
            }
          },
          {
            flight_number: 'VS003',
            airline: 'Virgin Atlantic',
            alliance: 'Virgin Atlantic',
            route: 'LHR → JFK',
            terminal: 'Terminal 3',
            aircraft_type: 'Boeing 787',
            real_time_status: {
              flight_id: 'VSVS003',
              current_status: 'Boarding',
              delay_minutes: 0,
              gate: 'A5',
              last_updated: new Date().toISOString()
            }
          }
        ]
      },
      {
        passenger_id: 'PAX004',
        name: 'Hans Mueller',
        origin_airport: 'FRA',
        final_destination: 'ORD',
        alliance_status: 'Star Alliance Gold',
        connection_type: 'INBOUND_TO_VS',
        connection_flights: [
          {
            flight_number: 'LH925',
            airline: 'Lufthansa',
            alliance: 'Star Alliance',
            route: 'FRA → LHR',
            terminal: 'Terminal 2',
            aircraft_type: 'Airbus A350',
            real_time_status: {
              flight_id: 'LHLH925',
              current_status: 'Delayed',
              delay_minutes: 75,
              gate: '57',
              last_updated: new Date().toISOString()
            }
          },
          {
            flight_number: 'VS105',
            airline: 'Virgin Atlantic',
            alliance: 'Virgin Atlantic',
            route: 'LHR → ORD',
            terminal: 'Terminal 3',
            aircraft_type: 'Boeing 787',
            real_time_status: {
              flight_id: 'VSVS105',
              current_status: 'Scheduled',
              delay_minutes: 0,
              gate: 'A9',
              last_updated: new Date().toISOString()
            }
          }
        ]
      },
      {
        passenger_id: 'PAX005',
        name: 'Sarah O\'Connor',
        origin_airport: 'JFK',
        final_destination: 'DUB',
        alliance_status: 'Virgin Atlantic Silver',
        connection_type: 'VS_TO_SKYTEAM',
        connection_flights: [
          {
            flight_number: 'VS004',
            airline: 'Virgin Atlantic',
            alliance: 'Virgin Atlantic',
            route: 'JFK → LHR',
            terminal: 'Terminal 3',
            aircraft_type: 'Airbus A350',
            real_time_status: {
              flight_id: 'VSVS004',
              current_status: 'Arrived',
              delay_minutes: 20,
              gate: 'A6',
              last_updated: new Date().toISOString()
            }
          },
          {
            flight_number: 'EI154',
            airline: 'Aer Lingus',
            alliance: 'OneWorld',
            route: 'LHR → DUB',
            terminal: 'Terminal 2',
            aircraft_type: 'Airbus A320',
            real_time_status: {
              flight_id: 'EIEI154',
              current_status: 'Scheduled',
              delay_minutes: 0,
              gate: '23',
              last_updated: new Date().toISOString()
            }
          }
        ]
      }
    ];

    passengers.forEach(passenger => {
      this.passengers.set(passenger.passenger_id, passenger);
    });

    console.log(`[Virgin Atlantic Service] Initialized ${passengers.length} passengers with Virgin Atlantic/SkyTeam connections`);
  }

  private startMonitoring() {
    if (this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // Monitor for connection risks every 2 minutes
    setInterval(() => {
      this.analyzeVirginAtlanticConnections();
    }, 120000);

    // Initial analysis
    this.analyzeVirginAtlanticConnections();
    
    console.log('[Virgin Atlantic Service] Real-time monitoring started for Virgin Atlantic/SkyTeam connections');
  }

  private analyzeVirginAtlanticConnections() {
    Array.from(this.passengers.values()).forEach(passenger => {
      this.analyzePassengerConnection(passenger);
    });
  }

  private analyzePassengerConnection(passenger: VirginAtlanticPassenger) {
    if (passenger.connection_flights.length < 2) return;

    const [inboundFlight, outboundFlight] = passenger.connection_flights;
    
    // Calculate connection time
    const connectionTimeMinutes = this.calculateConnectionTime(inboundFlight, outboundFlight);
    
    // Check for various risk scenarios
    this.checkInboundDelay(passenger, inboundFlight, outboundFlight);
    this.checkTightConnection(passenger, inboundFlight, outboundFlight, connectionTimeMinutes);
    this.checkTerminalChange(passenger, inboundFlight, outboundFlight);
    this.checkVirginAtlanticSkyTeamRisk(passenger, inboundFlight, outboundFlight);
  }

  private calculateConnectionTime(inboundFlight: VirginAtlanticConnectionFlight, outboundFlight: VirginAtlanticConnectionFlight): number {
    // Simplified connection time calculation - in real system would use actual schedules
    const baseConnectionTime = 75; // minutes
    const delay = inboundFlight.real_time_status.delay_minutes;
    return Math.max(0, baseConnectionTime - delay);
  }

  private checkInboundDelay(passenger: VirginAtlanticPassenger, inboundFlight: VirginAtlanticConnectionFlight, outboundFlight: VirginAtlanticConnectionFlight) {
    if (inboundFlight.real_time_status.delay_minutes >= 45) {
      const alert: VirginAtlanticConnectionAlert = {
        type: 'INBOUND_DELAY',
        passenger_id: passenger.passenger_id,
        passenger_name: passenger.name,
        risk_level: inboundFlight.real_time_status.delay_minutes >= 75 ? 'HIGH' : 'MEDIUM',
        timestamp: new Date().toISOString(),
        vs_flight: outboundFlight.airline === 'Virgin Atlantic' ? outboundFlight.flight_number : undefined,
        skyteam_flight: inboundFlight.alliance === 'SkyTeam' ? inboundFlight.flight_number : outboundFlight.alliance === 'SkyTeam' ? outboundFlight.flight_number : undefined,
        connection_details: `${inboundFlight.flight_number} delayed ${inboundFlight.real_time_status.delay_minutes} minutes`,
        recommended_action: 'Consider rebooking Virgin Atlantic flight or expedited connection assistance'
      };

      this.addAlert(alert);
    }
  }

  private checkTightConnection(passenger: VirginAtlanticPassenger, inboundFlight: VirginAtlanticConnectionFlight, outboundFlight: VirginAtlanticConnectionFlight, connectionTime: number) {
    if (connectionTime <= 45) {
      const alert: VirginAtlanticConnectionAlert = {
        type: 'TIGHT_CONNECTION',
        passenger_id: passenger.passenger_id,
        passenger_name: passenger.name,
        risk_level: connectionTime <= 30 ? 'CRITICAL' : 'HIGH',
        timestamp: new Date().toISOString(),
        vs_flight: outboundFlight.airline === 'Virgin Atlantic' ? outboundFlight.flight_number : inboundFlight.airline === 'Virgin Atlantic' ? inboundFlight.flight_number : undefined,
        skyteam_flight: inboundFlight.alliance === 'SkyTeam' ? inboundFlight.flight_number : outboundFlight.alliance === 'SkyTeam' ? outboundFlight.flight_number : undefined,
        connection_details: `Only ${connectionTime} minutes for connection`,
        recommended_action: 'Arrange priority assistance for Virgin Atlantic connection'
      };

      this.addAlert(alert);
    }
  }

  private checkTerminalChange(passenger: VirginAtlanticPassenger, inboundFlight: VirginAtlanticConnectionFlight, outboundFlight: VirginAtlanticConnectionFlight) {
    if (inboundFlight.terminal !== outboundFlight.terminal) {
      const isHighRisk = (inboundFlight.terminal === 'Terminal 4' && outboundFlight.terminal === 'Terminal 3') ||
                        (inboundFlight.terminal === 'Terminal 2' && outboundFlight.terminal === 'Terminal 3');

      const alert: VirginAtlanticConnectionAlert = {
        type: 'TERMINAL_CHANGE',
        passenger_id: passenger.passenger_id,
        passenger_name: passenger.name,
        risk_level: isHighRisk ? 'MEDIUM' : 'LOW',
        timestamp: new Date().toISOString(),
        vs_flight: outboundFlight.airline === 'Virgin Atlantic' ? outboundFlight.flight_number : inboundFlight.airline === 'Virgin Atlantic' ? inboundFlight.flight_number : undefined,
        connection_details: `Terminal change: ${inboundFlight.terminal} → ${outboundFlight.terminal}`,
        recommended_action: 'Provide Virgin Atlantic terminal transfer assistance'
      };

      this.addAlert(alert);
    }
  }

  private checkVirginAtlanticSkyTeamRisk(passenger: VirginAtlanticPassenger, inboundFlight: VirginAtlanticConnectionFlight, outboundFlight: VirginAtlanticConnectionFlight) {
    // Special risk analysis for Virgin Atlantic <-> SkyTeam connections
    const hasVirginAtlantic = inboundFlight.airline === 'Virgin Atlantic' || outboundFlight.airline === 'Virgin Atlantic';
    const hasSkyTeam = inboundFlight.alliance === 'SkyTeam' || outboundFlight.alliance === 'SkyTeam';

    if (hasVirginAtlantic && hasSkyTeam) {
      const totalDelay = inboundFlight.real_time_status.delay_minutes + outboundFlight.real_time_status.delay_minutes;
      
      if (totalDelay >= 30 || (inboundFlight.terminal !== outboundFlight.terminal && totalDelay >= 15)) {
        const alert: VirginAtlanticConnectionAlert = {
          type: 'VS_SKYTEAM_RISK',
          passenger_id: passenger.passenger_id,
          passenger_name: passenger.name,
          risk_level: totalDelay >= 60 ? 'HIGH' : 'MEDIUM',
          timestamp: new Date().toISOString(),
          vs_flight: inboundFlight.airline === 'Virgin Atlantic' ? inboundFlight.flight_number : outboundFlight.flight_number,
          skyteam_flight: inboundFlight.alliance === 'SkyTeam' ? inboundFlight.flight_number : outboundFlight.flight_number,
          connection_details: `Virgin Atlantic ↔ SkyTeam connection risk (${totalDelay}min total delay)`,
          recommended_action: 'Coordinate between Virgin Atlantic and SkyTeam partner for seamless connection'
        };

        this.addAlert(alert);
      }
    }
  }

  private addAlert(alert: VirginAtlanticConnectionAlert) {
    // Check if similar alert already exists (prevent duplicates)
    const existingAlert = this.alerts.find(a => 
      a.passenger_id === alert.passenger_id && 
      a.type === alert.type &&
      Date.now() - new Date(a.timestamp).getTime() < 300000 // 5 minutes
    );

    if (!existingAlert) {
      this.alerts.push(alert);
      // Keep only last 20 alerts
      if (this.alerts.length > 20) {
        this.alerts = this.alerts.slice(-20);
      }

      console.log(`[Virgin Atlantic Alert] ${alert.type} - ${alert.passenger_name} - ${alert.risk_level}`);
    }
  }

  public getPassenger(passengerId: string): VirginAtlanticPassenger | undefined {
    return this.passengers.get(passengerId);
  }

  public getAllPassengers(): VirginAtlanticPassenger[] {
    return Array.from(this.passengers.values());
  }

  public getAlerts(): VirginAtlanticConnectionAlert[] {
    return this.alerts.slice(-10); // Return last 10 alerts
  }

  public getConnectionReport() {
    const totalPassengers = this.passengers.size;
    const activeAlerts = this.alerts.filter(alert => 
      Date.now() - new Date(alert.timestamp).getTime() < 3600000 // 1 hour
    ).length;

    const riskLevels = this.alerts.reduce((acc, alert) => {
      acc[alert.risk_level] = (acc[alert.risk_level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      summary: {
        total_passengers_monitored: totalPassengers,
        active_virgin_atlantic_connections: this.passengers.size,
        skyteam_partnerships: Array.from(this.passengers.values()).filter(p => 
          p.connection_flights.some(f => f.alliance === 'SkyTeam')
        ).length,
        active_alerts: activeAlerts,
        risk_distribution: riskLevels
      },
      last_updated: new Date().toISOString()
    };
  }
}

// Global instance
export const virginAtlanticConnectionService = new VirginAtlanticConnectionService();