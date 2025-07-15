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
    
    let status = statuses[Math.floor(Math.random() * statuses.length)];
    let delay = 0;
    
    // Create specific scenarios for alert testing
    if (flightNumber === "LH925") {
      // Delayed Frankfurt flight for Hans Mueller
      status = FlightStatus.DELAYED;
      delay = 75; // 75 minute delay - will cause missed connection
    } else if (flightNumber === "AF1380") {
      // Air France flight for Sophie Laurent - on time but creates tight connection
      status = FlightStatus.DEPARTED;
      delay = 0;
    } else if (flightNumber === "BA245") {
      // British Airways connection flight - normal
      status = FlightStatus.BOARDING;
      delay = 5; // Slight delay
    } else {
      delay = status === FlightStatus.DELAYED ? Math.floor(Math.random() * 120) : 0;
    }
    
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

  addAlert(alert: ConnectionAlert): void {
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
      { code: "EK", name: "Emirates", alliance: Alliance.INDEPENDENT, terminal: Terminal.T3 },
      { code: "BA", name: "British Airways", alliance: Alliance.ONEWORLD, terminal: Terminal.T5 },
      { code: "LH", name: "Lufthansa", alliance: Alliance.STAR_ALLIANCE, terminal: Terminal.T2 },
      { code: "UA", name: "United Airlines", alliance: Alliance.STAR_ALLIANCE, terminal: Terminal.T2 }
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
      { code: "FRA", name: "Frankfurt", country: "Germany", region: "Europe" },
      { code: "DUB", name: "Dublin", country: "Ireland", region: "Europe" },
      { code: "JFK", name: "New York JFK", country: "United States", region: "North America" },
      { code: "LAX", name: "Los Angeles", country: "United States", region: "North America" },
      { code: "ATL", name: "Atlanta", country: "United States", region: "North America" },
      { code: "ORD", name: "Chicago O'Hare", country: "United States", region: "North America" },
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

    // Create additional mock flights for more scenarios
    const additionalFlights: Flight[] = [
      {
        flight_number: "AF1380",
        airline: this.airlines.get("AF")!,
        origin: this.airports.get("CDG")!,
        destination: this.airports.get("LHR")!,
        departure_time: new Date(Date.now() + 1 * 60 * 60 * 1000), // 1 hour from now
        arrival_time: new Date(Date.now() + 2.5 * 60 * 60 * 1000), // 2.5 hours from now
        terminal: Terminal.T4,
        aircraft_type: "Airbus A320"
      },
      {
        flight_number: "BA245",
        airline: this.airlines.get("BA")!,
        origin: this.airports.get("LHR")!,
        destination: this.airports.get("JFK")!,
        departure_time: new Date(Date.now() + 3 * 60 * 60 * 1000), // 3 hours from now (tight connection!)
        arrival_time: new Date(Date.now() + 11 * 60 * 60 * 1000),
        terminal: Terminal.T5,
        aircraft_type: "Boeing 777"
      },
      {
        flight_number: "LH925",
        airline: this.airlines.get("LH")!,
        origin: this.airports.get("FRA")!,
        destination: this.airports.get("LHR")!,
        departure_time: new Date(Date.now() + 0.5 * 60 * 60 * 1000), // 30 minutes from now
        arrival_time: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now (DELAYED!)
        terminal: Terminal.T2,
        aircraft_type: "Airbus A350"
      },
      {
        flight_number: "UA901",
        airline: this.airlines.get("UA")!,
        origin: this.airports.get("LHR")!,
        destination: this.airports.get("ORD")!,
        departure_time: new Date(Date.now() + 2.75 * 60 * 60 * 1000), // 2h 45m from now
        arrival_time: new Date(Date.now() + 11.5 * 60 * 60 * 1000),
        terminal: Terminal.T2,
        aircraft_type: "Boeing 787"
      },
      {
        flight_number: "VS11",
        airline: this.airlines.get("VS")!,
        origin: this.airports.get("JFK")!,
        destination: this.airports.get("LHR")!,
        departure_time: new Date(Date.now() + 4 * 60 * 60 * 1000),
        arrival_time: new Date(Date.now() + 12 * 60 * 60 * 1000),
        terminal: Terminal.T3,
        aircraft_type: "Airbus A350"
      },
      {
        flight_number: "VS401",
        airline: this.airlines.get("VS")!,
        origin: this.airports.get("LHR")!,
        destination: this.airports.get("DUB")!,
        departure_time: new Date(Date.now() + 13.5 * 60 * 60 * 1000),
        arrival_time: new Date(Date.now() + 15 * 60 * 60 * 1000),
        terminal: Terminal.T3,
        aircraft_type: "Airbus A330"
      }
    ];

    // Add all flights to system
    mockFlights.forEach(flight => this.addFlight(flight));
    additionalFlights.forEach(flight => this.addFlight(flight));

    // Create mock passengers with various connection scenarios
    const passengers: Passenger[] = [
      {
        passenger_id: "PAX001",
        name: "John Kimani",
        origin: this.airports.get("NBO")!,
        final_destination: this.airports.get("ATL")!,
        alliance_status: "SkyTeam Elite",
        connection_flights: [mockFlights[0], mockFlights[1]] // KQ100 -> DL16 (Good connection)
      },
      {
        passenger_id: "PAX002", 
        name: "Priya Sharma",
        origin: this.airports.get("DEL")!,
        final_destination: this.airports.get("YYZ")!,
        alliance_status: "Virgin Atlantic Gold",
        connection_flights: [mockFlights[2], mockFlights[3]] // VS131 -> VS3 (Good connection)
      },
      {
        passenger_id: "PAX003",
        name: "Sophie Laurent",
        origin: this.airports.get("CDG")!,
        final_destination: this.airports.get("JFK")!,
        alliance_status: "SkyTeam Elite Plus",
        connection_flights: [additionalFlights[0], additionalFlights[1]] // AF1380 -> BA245 (TIGHT CONNECTION - RISK!)
      },
      {
        passenger_id: "PAX004",
        name: "Hans Mueller",
        origin: this.airports.get("FRA")!,
        final_destination: this.airports.get("ORD")!,
        alliance_status: "Star Alliance Gold",
        connection_flights: [additionalFlights[2], additionalFlights[3]] // LH925 -> UA901 (DELAYED INBOUND - HIGH RISK!)
      },
      {
        passenger_id: "PAX005",
        name: "Sarah O'Connor",
        origin: this.airports.get("JFK")!,
        final_destination: this.airports.get("DUB")!,
        alliance_status: "Virgin Atlantic Silver",
        connection_flights: [additionalFlights[4], additionalFlights[5]] // VS11 -> VS401 (Good Virgin connection)
      }
    ];

    passengers.forEach(passenger => this.addPassenger(passenger));
    
    // Generate initial connection alerts for demonstration
    this.generateDemoAlerts();
  }

  private generateDemoAlerts(): void {
    // Generate alerts for the risky connection scenarios
    const now = new Date();
    
    // Alert 1: Tight connection for Sophie Laurent (PAX003)
    const tightConnectionAlert: ConnectionAlert = {
      type: "TIGHT_CONNECTION",
      passenger_id: "PAX003",
      passenger_name: "Sophie Laurent",
      arriving_flight: "AF1380",
      departing_flight: "BA245",
      connection_time: "30 minutes",
      risk_level: "HIGH",
      timestamp: new Date(now.getTime() - 5 * 60 * 1000) // 5 minutes ago
    };

    // Alert 2: Delayed inbound flight for Hans Mueller (PAX004)
    const delayedInboundAlert: ConnectionAlert = {
      type: "INBOUND_DELAY",
      passenger_id: "PAX004",
      passenger_name: "Hans Mueller",
      flight: "LH925",
      delay_minutes: 75,
      risk_level: "HIGH",
      timestamp: new Date(now.getTime() - 10 * 60 * 1000) // 10 minutes ago
    };

    // Alert 3: Terminal change required for connection
    const terminalChangeAlert: ConnectionAlert = {
      type: "TERMINAL_CHANGE",
      passenger_id: "PAX003",
      passenger_name: "Sophie Laurent",
      arriving_flight: "AF1380",
      departing_flight: "BA245",
      connection_time: "Terminal 4 → Terminal 5 transfer required",
      risk_level: "MEDIUM",
      timestamp: new Date(now.getTime() - 2 * 60 * 1000) // 2 minutes ago
    };

    // Alert 4: Gate change notification
    const gateChangeAlert: ConnectionAlert = {
      type: "GATE_CHANGE",
      passenger_id: "PAX002",
      passenger_name: "Priya Sharma",
      flight: "VS3",
      connection_time: "Gate changed from 15 to 22",
      risk_level: "LOW",
      timestamp: new Date(now.getTime() - 15 * 60 * 1000) // 15 minutes ago
    };

    // Add alerts to the connection monitor
    this.connectionMonitor.addAlert(tightConnectionAlert);
    this.connectionMonitor.addAlert(delayedInboundAlert);
    this.connectionMonitor.addAlert(terminalChangeAlert);
    this.connectionMonitor.addAlert(gateChangeAlert);
  }
}