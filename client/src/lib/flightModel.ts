export interface FlightModel {
  flightNumber: string;
  origin: string;
  destination: string;
  aircraftType: string;
  crewOnDuty: number; // minutes remaining
  fuelOnBoard: number; // kg
  etd: string;
  eta: string;
  status: 'Scheduled' | 'Departed' | 'En Route' | 'Delayed' | 'Diverted' | 'Arrived' | 'Cancelled';
}

export class Flight {
  public flightNumber: string;
  public origin: string;
  public destination: string;
  public aircraftType: string;
  public crewOnDuty: number;
  public fuelOnBoard: number;
  public etd: string;
  public eta: string;
  public status: FlightModel['status'];

  constructor(
    flightNumber: string,
    origin: string,
    destination: string,
    aircraftType: string,
    crewOnDuty: number,
    fuelOnBoard: number,
    etd: string,
    eta: string
  ) {
    this.flightNumber = flightNumber;
    this.origin = origin;
    this.destination = destination;
    this.aircraftType = aircraftType;
    this.crewOnDuty = crewOnDuty;
    this.fuelOnBoard = fuelOnBoard;
    this.etd = etd;
    this.eta = eta;
    this.status = 'Scheduled';
  }

  updateEta(newEta: string): void {
    this.eta = newEta;
  }

  updateStatus(newStatus: FlightModel['status']): void {
    this.status = newStatus;
  }

  updateCrewDuty(minutes: number): void {
    this.crewOnDuty = Math.max(0, minutes);
  }

  updateFuelOnBoard(fuelKg: number): void {
    this.fuelOnBoard = Math.max(0, fuelKg);
  }

  getCrewDutyHours(): number {
    return Math.floor(this.crewOnDuty / 60);
  }

  getCrewDutyMinutes(): number {
    return this.crewOnDuty % 60;
  }

  isCrewDutyLimited(): boolean {
    return this.crewOnDuty <= 120; // Less than 2 hours remaining
  }

  isFuelCritical(): boolean {
    // Determine if fuel is critical based on aircraft type
    const minFuelThresholds = {
      'B787': 15000, // kg
      'A350': 18000,
      'A330': 16000,
      'B777': 20000,
      'A340': 22000
    };

    const threshold = minFuelThresholds[this.aircraftType as keyof typeof minFuelThresholds] || 15000;
    return this.fuelOnBoard <= threshold;
  }

  getOperationalLimitations(): string[] {
    const limitations: string[] = [];

    if (this.isCrewDutyLimited()) {
      limitations.push(`Crew duty limited: ${this.getCrewDutyHours()}h ${this.getCrewDutyMinutes()}m remaining`);
    }

    if (this.isFuelCritical()) {
      limitations.push(`Fuel critical: ${this.fuelOnBoard.toLocaleString()} kg remaining`);
    }

    if (this.crewOnDuty <= 60) {
      limitations.push('Crew approaching maximum duty time');
    }

    return limitations;
  }

  printSummary(): FlightModel {
    return {
      flightNumber: this.flightNumber,
      origin: this.origin,
      destination: this.destination,
      aircraftType: this.aircraftType,
      crewOnDuty: this.crewOnDuty,
      fuelOnBoard: this.fuelOnBoard,
      etd: this.etd,
      eta: this.eta,
      status: this.status
    };
  }

  // Calculate estimated flight time in minutes
  getEstimatedFlightTime(): number {
    const etdTime = new Date(this.etd);
    const etaTime = new Date(this.eta);
    return Math.max(0, (etaTime.getTime() - etdTime.getTime()) / (1000 * 60));
  }

  // Check if diversion would exceed crew duty limits
  canAcceptDiversion(additionalMinutes: number): boolean {
    return (this.crewOnDuty - additionalMinutes) > 30; // Must have 30 min buffer
  }

  // Calculate fuel consumption rate
  getFuelConsumptionRate(): number {
    const flightTimeMinutes = this.getEstimatedFlightTime();
    if (flightTimeMinutes <= 0) return 0;
    
    // Estimate based on aircraft type and flight time
    const baseFuelConsumption = {
      'B787': 6800, // kg/hour
      'A350': 6500,
      'A330': 7200,
      'B777': 8500,
      'A340': 9200
    };

    const hourlyRate = baseFuelConsumption[this.aircraftType as keyof typeof baseFuelConsumption] || 7000;
    return hourlyRate / 60; // kg per minute
  }

  // Estimate fuel required for diversion
  calculateDiversionFuel(diversionTimeMinutes: number): number {
    const consumptionRate = this.getFuelConsumptionRate();
    const diversionFuel = consumptionRate * diversionTimeMinutes;
    const reserveFuel = diversionFuel * 0.1; // 10% reserve
    return Math.round(diversionFuel + reserveFuel);
  }

  // Check if flight has sufficient fuel for diversion
  canCompleteDiversion(diversionTimeMinutes: number): boolean {
    const requiredFuel = this.calculateDiversionFuel(diversionTimeMinutes);
    const minimumReserve = 3000; // kg minimum reserve
    return (this.fuelOnBoard - requiredFuel) >= minimumReserve;
  }
}

// Aircraft performance models for multi-aircraft decision support
export class FlightModel {
  private aircraftType: 'A350' | 'A330' | '787';
  
  constructor(aircraftType: 'A350' | 'A330' | '787') {
    this.aircraftType = aircraftType;
  }

  getOperatingWeight(): number {
    const weights = {
      'A350': 137000, // kg
      'A330': 120000,
      '787': 118000
    };
    return weights[this.aircraftType];
  }

  getMaxRange(): number {
    const ranges = {
      'A350': 15000, // km
      'A330': 13400,
      '787': 14800
    };
    return ranges[this.aircraftType];
  }

  getFuelBurnRate(): number {
    const burnRates = {
      'A350': 6500, // kg/hour
      'A330': 7200,
      '787': 6800
    };
    return burnRates[this.aircraftType];
  }

  getMaxFuelCapacity(): number {
    const capacities = {
      'A350': 138000, // kg
      'A330': 139090,
      '787': 126372
    };
    return capacities[this.aircraftType];
  }

  getCruiseSpeed(): number {
    const speeds = {
      'A350': 903, // km/h
      'A330': 871,
      '787': 913
    };
    return speeds[this.aircraftType];
  }

  getServiceCeiling(): number {
    const ceilings = {
      'A350': 43000, // feet
      'A330': 41450,
      '787': 43000
    };
    return ceilings[this.aircraftType];
  }

  calculateFlightTime(distanceKm: number): number {
    const cruiseSpeed = this.getCruiseSpeed();
    return (distanceKm / cruiseSpeed) * 60; // minutes
  }

  calculateFuelRequired(distanceKm: number): number {
    const flightTimeHours = distanceKm / this.getCruiseSpeed();
    const burnRate = this.getFuelBurnRate();
    return Math.round(flightTimeHours * burnRate);
  }

  canReachDestination(distanceKm: number, currentFuel: number): boolean {
    const requiredFuel = this.calculateFuelRequired(distanceKm);
    const reserveFuel = requiredFuel * 0.15; // 15% reserve
    return currentFuel >= (requiredFuel + reserveFuel);
  }
}