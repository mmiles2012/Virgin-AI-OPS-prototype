import { EventEmitter } from 'events';

// Enhanced passenger connection monitoring service for AINO platform
// Integrates with existing Heathrow T3 connection management

export enum FlightStatus {
  SCHEDULED = "Scheduled",
  DEPARTED = "Departed", 
  AIRBORNE = "Airborne",
  ARRIVED = "Arrived",
  DELAYED = "Delayed",
  CANCELLED = "Cancelled",
  DIVERTED = "Diverted",
  BOARDING = "Boarding",
  GATE_CLOSED = "Gate Closed"
}

export enum Terminal {
  T1 = "Terminal 1", // Historical
  T2 = "Terminal 2", // Star Alliance
  T3 = "Terminal 3", // SkyTeam, Virgin Atlantic
  T4 = "Terminal 4", // SkyTeam
  T5 = "Terminal 5"  // OneWorld, British Airways
}

export enum Alliance {
  SKYTEAM = "SkyTeam",
  VIRGIN_ATLANTIC = "Virgin Atlantic",
  STAR_ALLIANCE = "Star Alliance", 
  ONEWORLD = "OneWorld",
  INDEPENDENT = "Independent"
}

export interface Airport {
  code: string;
  name: string;
  country: string;
  region: string;
}

export interface Airline {
  code: string;
  name: string;
  alliance: Alliance;
  terminal: Terminal;
}

export interface RealTimeFlightData {
  flight_id: string;
  current_status: FlightStatus;
  actual_departure?: Date;
  actual_arrival?: Date;
  estimated_departure?: Date;
  estimated_arrival?: Date;
  delay_minutes: number;
  gate?: string;
  current_altitude?: number;
  current_speed?: number;
  current_location?: [number, number]; // [lat, lon]
  last_updated: Date;
}

export interface Flight {
  flight_number: string;
  airline: Airline;
  origin: Airport;
  destination: Airport;
  departure_time: Date;
  arrival_time: Date;
  terminal: Terminal;
  aircraft_type: string;
  real_time_data?: RealTimeFlightData;
}

export interface Passenger {
  passenger_id: string;
  name: string;
  origin: Airport;
  final_destination: Airport;
  alliance_status: string;
  connection_flights: Flight[];
}

export interface ConnectionAlert {
  type: string;
  passenger_id: string;
  passenger_name: string;
  risk_level: string;
  timestamp: Date;
  arriving_flight?: string;
  departing_flight?: string;
  connection_time?: string;
  delay_minutes?: number;
  flight?: string;
}

export class FlightTracker {
  private cache: Map<string, { data: RealTimeFlightData, timestamp: number }> = new Map();
  private cacheDuration = 300000; // 5 minutes

  constructor(private apiKey?: string) {
    this.apiKey = apiKey || "demo_key";
  }

  async getFlightStatus(flightNumber: string, airlineCode: string): Promise<RealTimeFlightData | null> {
    const cacheKey = `${airlineCode}${flightNumber}`;
    
    // Check cache first
    const cached = this.cache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < this.cacheDuration) {
      return cached.data;
    }

    try {
      // Simulate API call with realistic data
      const simulatedData = this.simulateFlightData(flightNumber, airlineCode);
      
      // Cache result
      this.cache.set(cacheKey, { data: simulatedData, timestamp: Date.now() });
      
      return simulatedData;
    } catch (error) {
      console.error(`Error fetching flight data for ${airlineCode}${flightNumber}:`, error);
      return null;
    }
  }

  private simulateFlightData(flightNumber: string, airlineCode: string): RealTimeFlightData {
    const statuses = [
      FlightStatus.SCHEDULED, FlightStatus.DEPARTED, FlightStatus.AIRBORNE,
      FlightStatus.ARRIVED, FlightStatus.DELAYED, FlightStatus.BOARDING
    ];
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const delay = status === FlightStatus.DELAYED ? Math.floor(Math.random() * 120) : 0;
    
    let latitude: number | undefined;
    let longitude: number | undefined;
    let altitude: number | undefined;
    let speed: number | undefined;

    if (status === FlightStatus.AIRBORNE) {
      latitude = 20 + Math.random() * 40; // Rough Atlantic/European airspace
      longitude = -80 + Math.random() * 90;
      altitude = 30000 + Math.floor(Math.random() * 12000);
      speed = 450 + Math.floor(Math.random() * 100);
    }

    return {
      flight_id: `${airlineCode}${flightNumber}`,
      current_status: status,
      delay_minutes: delay,
      gate: Math.random() > 0.5 ? `${Math.floor(Math.random() * 59) + 1}` : undefined, // T3 stands 1-59
      current_altitude: altitude,
      current_speed: speed,
      current_location: latitude && longitude ? [latitude, longitude] : undefined,
      last_updated: new Date()
    };
  }

  async getMultipleFlightStatus(flightList: Array<[string, string]>): Promise<Record<string, RealTimeFlightData>> {
    const results: Record<string, RealTimeFlightData> = {};
    
    const promises = flightList.map(async ([flightNumber, airlineCode]) => {
      const data = await this.getFlightStatus(flightNumber, airlineCode);
      if (data) {
        results[`${airlineCode}${flightNumber}`] = data;
      }
    });

    await Promise.all(promises);
    return results;
  }
}

export class ConnectionMonitor extends EventEmitter {
  private monitoredPassengers: Map<string, Passenger> = new Map();
  private alerts: ConnectionAlert[] = [];
  private isRunning = false;
  private monitoringInterval?: NodeJS.Timeout;

  constructor(private flightTracker: FlightTracker) {
    super();
  }

  addPassengerMonitoring(passenger: Passenger): void {
    this.monitoredPassengers.set(passenger.passenger_id, passenger);
    this.emit('passengerAdded', passenger);
  }

  removePassengerMonitoring(passengerId: string): void {
    this.monitoredPassengers.delete(passengerId);
    this.emit('passengerRemoved', passengerId);
  }

  startMonitoring(): void {
    if (this.isRunning) return;
    
    this.isRunning = true;
    this.monitoringInterval = setInterval(() => {
      this.checkAllPassengers();
    }, 60000); // Check every minute

    console.log('[AINO Passenger Monitor] Real-time monitoring started');
    this.emit('monitoringStarted');
  }

  stopMonitoring(): void {
    if (!this.isRunning) return;

    this.isRunning = false;
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }

    console.log('[AINO Passenger Monitor] Real-time monitoring stopped');
    this.emit('monitoringStopped');
  }

  private async checkAllPassengers(): Promise<void> {
    for (const [passengerId, passenger] of Array.from(this.monitoredPassengers)) {
      try {
        await this.checkPassengerConnections(passenger);
      } catch (error) {
        console.error(`Error checking passenger ${passengerId}:`, error);
      }
    }
  }

  private async checkPassengerConnections(passenger: Passenger): Promise<void> {
    if (!passenger.connection_flights || passenger.connection_flights.length < 2) {
      return;
    }

    for (let i = 0; i < passenger.connection_flights.length - 1; i++) {
      const arrivingFlight = passenger.connection_flights[i];
      const departingFlight = passenger.connection_flights[i + 1];

      const [arrivingData, departingData] = await Promise.all([
        this.flightTracker.getFlightStatus(arrivingFlight.flight_number, arrivingFlight.airline.code),
        this.flightTracker.getFlightStatus(departingFlight.flight_number, departingFlight.airline.code)
      ]);

      if (arrivingData && departingData) {
        arrivingFlight.real_time_data = arrivingData;
        departingFlight.real_time_data = departingData;

        this.analyzeConnectionRisk(passenger, arrivingFlight, departingFlight);
      }
    }
  }

  private analyzeConnectionRisk(passenger: Passenger, arrivingFlight: Flight, departingFlight: Flight): void {
    const arrivingData = arrivingFlight.real_time_data!;
    const departingData = departingFlight.real_time_data!;

    // Check connection time
    if (arrivingData.estimated_arrival && departingData.estimated_departure) {
      const connectionTime = departingData.estimated_departure.getTime() - arrivingData.estimated_arrival.getTime();
      const connectionMinutes = connectionTime / (1000 * 60);

      const minConnectionTime = arrivingFlight.terminal === departingFlight.terminal ? 60 : 90;

      if (connectionMinutes < minConnectionTime) {
        const alert: ConnectionAlert = {
          type: "TIGHT_CONNECTION",
          passenger_id: passenger.passenger_id,
          passenger_name: passenger.name,
          arriving_flight: arrivingFlight.flight_number,
          departing_flight: departingFlight.flight_number,
          connection_time: `${Math.round(connectionMinutes)} minutes`,
          risk_level: connectionMinutes < 60 ? "HIGH" : "MEDIUM",
          timestamp: new Date()
        };

        this.addAlert(alert);
      }
    }

    // Check for delays
    if (arrivingData.delay_minutes > 30) {
      const alert: ConnectionAlert = {
        type: "INBOUND_DELAY",
        passenger_id: passenger.passenger_id,
        passenger_name: passenger.name,
        flight: arrivingFlight.flight_number,
        delay_minutes: arrivingData.delay_minutes,
        risk_level: arrivingData.delay_minutes > 60 ? "HIGH" : "MEDIUM",
        timestamp: new Date()
      };

      this.addAlert(alert);
    }
  }

  private addAlert(alert: ConnectionAlert): void {
    this.alerts.push(alert);
    
    // Keep only last 1000 alerts
    if (this.alerts.length > 1000) {
      this.alerts = this.alerts.slice(-1000);
    }

    console.log(`[AINO Connection Alert] ${alert.type} - ${alert.passenger_name} - ${alert.risk_level}`);
    this.emit('connectionAlert', alert);
  }

  getRecentAlerts(hours: number = 24): ConnectionAlert[] {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.alerts.filter(alert => alert.timestamp > cutoffTime);
  }

  getPassengerAlerts(passengerId: string, hours: number = 24): ConnectionAlert[] {
    return this.getRecentAlerts(hours).filter(alert => alert.passenger_id === passengerId);
  }
}

export class PassengerConnectionService {
  private airlines: Map<string, Airline> = new Map();
  private airports: Map<string, Airport> = new Map();
  private flights: Flight[] = [];
  private passengers: Map<string, Passenger> = new Map();
  private flightTracker: FlightTracker;
  private connectionMonitor: ConnectionMonitor;

  constructor(apiKey?: string) {
    this.initializeAirlines();
    this.initializeAirports();
    this.flightTracker = new FlightTracker(apiKey);
    this.connectionMonitor = new ConnectionMonitor(this.flightTracker);
  }

  private initializeAirlines(): void {
    const airlineData = [
      { code: "AF", name: "Air France", alliance: Alliance.SKYTEAM, terminal: Terminal.T4 },
      { code: "KL", name: "KLM", alliance: Alliance.SKYTEAM, terminal: Terminal.T4 },
      { code: "DL", name: "Delta Air Lines", alliance: Alliance.SKYTEAM, terminal: Terminal.T3 },
      { code: "AZ", name: "ITA Airways", alliance: Alliance.SKYTEAM, terminal: Terminal.T3 },
      { code: "VS", name: "Virgin Atlantic", alliance: Alliance.VIRGIN_ATLANTIC, terminal: Terminal.T3 },
      { code: "KQ", name: "Kenya Airways", alliance: Alliance.SKYTEAM, terminal: Terminal.T4 },
      { code: "ET", name: "Ethiopian Airlines", alliance: Alliance.STAR_ALLIANCE, terminal: Terminal.T2 },
      { code: "EK", name: "Emirates", alliance: Alliance.INDEPENDENT, terminal: Terminal.T3 }
    ];

    airlineData.forEach(airline => {
      this.airlines.set(airline.code, airline);
    });
  }

  private initializeAirports(): void {
    const airportData = [
      { code: "LHR", name: "London Heathrow", country: "United Kingdom", region: "Europe" },
      { code: "CDG", name: "Paris Charles de Gaulle", country: "France", region: "Europe" },
      { code: "AMS", name: "Amsterdam Schiphol", country: "Netherlands", region: "Europe" },
      { code: "JFK", name: "New York JFK", country: "United States", region: "North America" },
      { code: "LAX", name: "Los Angeles", country: "United States", region: "North America" },
      { code: "ATL", name: "Atlanta", country: "United States", region: "North America" },
      { code: "NBO", name: "Nairobi", country: "Kenya", region: "Africa" },
      { code: "ADD", name: "Addis Ababa", country: "Ethiopia", region: "Africa" },
      { code: "DEL", name: "New Delhi", country: "India", region: "Asia" },
      { code: "BOM", name: "Mumbai", country: "India", region: "Asia" },
      { code: "YYZ", name: "Toronto Pearson", country: "Canada", region: "North America" }
    ];

    airportData.forEach(airport => {
      this.airports.set(airport.code, airport);
    });
  }

  addPassenger(passenger: Passenger): void {
    this.passengers.set(passenger.passenger_id, passenger);
    this.connectionMonitor.addPassengerMonitoring(passenger);
  }

  addFlight(flight: Flight): void {
    this.flights.push(flight);
  }

  async getFlightRealTimeStatus(flightNumber: string, airlineCode: string): Promise<any> {
    const realTimeData = await this.flightTracker.getFlightStatus(flightNumber, airlineCode);
    
    if (!realTimeData) {
      return { status: "No real-time data available" };
    }

    return {
      flight_id: realTimeData.flight_id,
      current_status: realTimeData.current_status,
      delay_minutes: realTimeData.delay_minutes,
      gate: realTimeData.gate,
      last_updated: realTimeData.last_updated.toISOString(),
      altitude: realTimeData.current_altitude ? `${realTimeData.current_altitude.toLocaleString()} ft` : undefined,
      speed: realTimeData.current_speed ? `${realTimeData.current_speed} mph` : undefined,
      location: realTimeData.current_location,
      estimated_departure: realTimeData.estimated_departure?.toISOString(),
      estimated_arrival: realTimeData.estimated_arrival?.toISOString()
    };
  }

  async getPassengerRealTimeStatus(passengerId: string): Promise<any> {
    const passenger = this.passengers.get(passengerId);
    
    if (!passenger) {
      return { error: "Passenger not found" };
    }

    const status: any = {
      passenger_id: passengerId,
      name: passenger.name,
      route: `${passenger.origin.code} → ${passenger.final_destination.code}`,
      alliance_status: passenger.alliance_status,
      connection_flights: []
    };

    for (const flight of passenger.connection_flights) {
      const flightStatus = await this.getFlightRealTimeStatus(flight.flight_number, flight.airline.code);
      const flightInfo = {
        flight_number: flight.flight_number,
        airline: flight.airline.name,
        route: `${flight.origin.code} → ${flight.destination.code}`,
        terminal: flight.terminal,
        aircraft_type: flight.aircraft_type,
        real_time_status: flightStatus
      };
      status.connection_flights.push(flightInfo);
    }

    return status;
  }

  calculateConnectionTime(arrivingFlight: Flight, departingFlight: Flight): number {
    const arrivalTime = arrivingFlight.real_time_data?.estimated_arrival || arrivingFlight.arrival_time;
    const departureTime = departingFlight.real_time_data?.estimated_departure || departingFlight.departure_time;
    
    return (departureTime.getTime() - arrivalTime.getTime()) / (1000 * 60); // minutes
  }

  isValidConnection(arrivingFlight: Flight, departingFlight: Flight): boolean {
    const connectionTime = this.calculateConnectionTime(arrivingFlight, departingFlight);
    const minTime = arrivingFlight.terminal === departingFlight.terminal ? 60 : 90;
    
    return connectionTime >= minTime;
  }

  startRealTimeMonitoring(): void {
    this.connectionMonitor.startMonitoring();
  }

  stopRealTimeMonitoring(): void {
    this.connectionMonitor.stopMonitoring();
  }

  getConnectionAlerts(hours: number = 24): ConnectionAlert[] {
    return this.connectionMonitor.getRecentAlerts(hours);
  }

  getPassengerAlerts(passengerId: string, hours: number = 24): ConnectionAlert[] {
    return this.connectionMonitor.getPassengerAlerts(passengerId, hours);
  }

  generateConnectionReport(): any {
    return {
      heathrow_terminals: {
        skyteam_primary: ["Terminal 3", "Terminal 4"],
        virgin_atlantic_primary: ["Terminal 3"],
        star_alliance_primary: ["Terminal 2"],
        oneworld_primary: ["Terminal 5"]
      },
      real_time_features: {
        flight_tracking: "Active",
        connection_monitoring: "Active",
        alert_system: "Active",
        monitored_passengers: this.passengers.size,
        recent_alerts: this.getConnectionAlerts(24).length
      },
      minimum_connection_times: {
        same_terminal: "60 minutes",
        different_terminals: "90 minutes",
        terminal_transfer_time: "15-30 minutes"
      },
      statistics: {
        total_passengers: this.passengers.size,
        total_flights: this.flights.length,
        active_connections: Array.from(this.passengers.values())
          .reduce((total, p) => total + Math.max(0, p.connection_flights.length - 1), 0)
      }
    };
  }

  // Mock data generation for demonstration
  generateMockScenarios(): void {
    // Create mock flights
    const mockFlights: Flight[] = [
      {
        flight_number: "KQ100",
        airline: this.airlines.get("KQ")!,
        origin: this.airports.get("NBO")!,
        destination: this.airports.get("LHR")!,
        departure_time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        arrival_time: new Date(Date.now() + 10 * 60 * 60 * 1000), // 10 hours from now
        terminal: Terminal.T4,
        aircraft_type: "Boeing 787"
      },
      {
        flight_number: "DL16",
        airline: this.airlines.get("DL")!,
        origin: this.airports.get("LHR")!,
        destination: this.airports.get("ATL")!,
        departure_time: new Date(Date.now() + 11 * 60 * 60 * 1000), // 11 hours from now
        arrival_time: new Date(Date.now() + 19 * 60 * 60 * 1000), // 19 hours from now
        terminal: Terminal.T3,
        aircraft_type: "Boeing 767"
      },
      {
        flight_number: "VS131",
        airline: this.airlines.get("VS")!,
        origin: this.airports.get("DEL")!,
        destination: this.airports.get("LHR")!,
        departure_time: new Date(Date.now() + 3 * 60 * 60 * 1000),
        arrival_time: new Date(Date.now() + 12 * 60 * 60 * 1000),
        terminal: Terminal.T3,
        aircraft_type: "Boeing 787"
      },
      {
        flight_number: "VS3",
        airline: this.airlines.get("VS")!,
        origin: this.airports.get("LHR")!,
        destination: this.airports.get("YYZ")!,
        departure_time: new Date(Date.now() + 13 * 60 * 60 * 1000),
        arrival_time: new Date(Date.now() + 21 * 60 * 60 * 1000),
        terminal: Terminal.T3,
        aircraft_type: "Airbus A330"
      }
    ];

    // Add flights to system
    mockFlights.forEach(flight => this.addFlight(flight));

    // Create mock passengers
    const africanPassenger: Passenger = {
      passenger_id: "PAX001",
      name: "John Kimani",
      origin: this.airports.get("NBO")!,
      final_destination: this.airports.get("ATL")!,
      alliance_status: "SkyTeam Elite",
      connection_flights: [mockFlights[0], mockFlights[1]] // KQ100 -> DL16
    };

    const indianPassenger: Passenger = {
      passenger_id: "PAX002", 
      name: "Priya Sharma",
      origin: this.airports.get("DEL")!,
      final_destination: this.airports.get("YYZ")!,
      alliance_status: "Virgin Atlantic Gold",
      connection_flights: [mockFlights[2], mockFlights[3]] // VS131 -> VS3
    };

    this.addPassenger(africanPassenger);
    this.addPassenger(indianPassenger);
  }
}