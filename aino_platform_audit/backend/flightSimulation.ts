import { FlightPhysicsEngine, FlightDynamics } from "../client/src/lib/flightPhysics";
import { boeing787Specs, FlightEnvelope } from "../client/src/lib/boeing787Specs";

export interface FlightControls {
  throttle: number; // 0-100%
  pitch: number; // -1 to 1
  roll: number; // -1 to 1
  yaw: number; // -1 to 1
  autopilot: boolean;
}

export interface FlightState {
  // Position and motion
  position: { lat: number; lon: number; altitude: number };
  velocity: { x: number; y: number; z: number };
  rotation: { pitch: number; yaw: number; roll: number };
  
  // Flight parameters
  airspeed: number; // knots
  groundSpeed: number; // knots
  heading: number; // degrees
  verticalSpeed: number; // feet per minute
  
  // Aircraft systems
  throttle: number; // percentage
  fuelRemaining: number; // kg
  weight: number; // kg
  
  // Engine data
  engines: {
    thrust: number; // percentage
    temperature: number; // Celsius
    fuelFlow: number; // kg/hour
  }[];
  
  // Flight modes
  autopilot: {
    engaged: boolean;
    mode: string;
    targetAltitude: number;
    targetHeading: number;
    targetSpeed: number;
  };
  
  // Emergency status
  emergency: {
    declared: boolean;
    type: string | null;
    startTime: Date | null;
  };
  
  // Environmental
  weather: {
    windSpeed: number;
    windDirection: number;
    turbulence: 'none' | 'light' | 'moderate' | 'severe';
    visibility: number; // miles
  };
  
  // Performance
  performance: {
    fuelConsumption: number; // kg/hour
    range: number; // nautical miles
    endurance: number; // hours
  };
}

export class FlightSimulationEngine {
  private physicsEngine: FlightPhysicsEngine;
  private flightState: FlightState;
  private controls: FlightControls;
  private lastUpdate: number;
  private active: boolean;

  constructor() {
    this.physicsEngine = new FlightPhysicsEngine();
    this.lastUpdate = Date.now();
    this.active = true;
    
    // Initialize flight controls
    this.controls = {
      throttle: 75,
      pitch: 0,
      roll: 0,
      yaw: 0,
      autopilot: true
    };

    // Initialize flight state
    this.flightState = {
      position: { lat: 34.0522, lon: -118.2437, altitude: 35000 }, // LAX area
      velocity: { x: 0, y: 0, z: -485 }, // Cruising speed
      rotation: { pitch: 0, yaw: 90, roll: 0 }, // Heading east
      
      airspeed: 485,
      groundSpeed: 485,
      heading: 90,
      verticalSpeed: 0,
      
      throttle: 75,
      fuelRemaining: 120000, // kg
      weight: 220000, // kg
      
      engines: [
        { thrust: 75, temperature: 750, fuelFlow: 2500 },
        { thrust: 75, temperature: 755, fuelFlow: 2500 }
      ],
      
      autopilot: {
        engaged: true,
        mode: "CRUISE",
        targetAltitude: 35000,
        targetHeading: 90,
        targetSpeed: 485
      },
      
      emergency: {
        declared: false,
        type: null,
        startTime: null
      },
      
      weather: {
        windSpeed: 15,
        windDirection: 270,
        turbulence: 'light',
        visibility: 10
      },
      
      performance: {
        fuelConsumption: 5000,
        range: 4500,
        endurance: 8.5
      }
    };
  }

  public update(): void {
    const now = Date.now();
    const deltaTime = (now - this.lastUpdate) / 1000; // Convert to seconds
    this.lastUpdate = now;

    if (!this.active) return;

    // Update physics
    const dynamics = this.physicsEngine.update(deltaTime, {
      throttle: this.controls.throttle,
      pitch: this.controls.pitch,
      roll: this.controls.roll,
      yaw: this.controls.yaw
    });

    // Update flight state from physics
    this.updateFlightStateFromPhysics(dynamics);

    // Update autopilot if engaged
    if (this.controls.autopilot) {
      this.updateAutopilot(deltaTime);
    }

    // Update fuel consumption
    this.updateFuelConsumption(deltaTime);

    // Update engine parameters
    this.updateEngineParameters();

    // Update performance calculations
    this.updatePerformanceMetrics();

    // Apply weather effects
    this.applyWeatherEffects();

    // Check for system warnings
    this.checkSystemWarnings();
  }

  private updateFlightStateFromPhysics(dynamics: FlightDynamics): void {
    // Update position (simplified lat/lon calculation)
    const deltaLat = dynamics.velocity.z / 111320; // meters to degrees
    const deltaLon = dynamics.velocity.x / (111320 * Math.cos(this.flightState.position.lat * Math.PI / 180));
    
    this.flightState.position.lat += deltaLat / 60; // Convert to roughly correct scale
    this.flightState.position.lon += deltaLon / 60;
    this.flightState.position.altitude = dynamics.position.y * 3.28084; // meters to feet

    // Update motion parameters
    this.flightState.velocity = {
      x: dynamics.velocity.x,
      y: dynamics.velocity.y,
      z: dynamics.velocity.z
    };

    this.flightState.rotation = {
      pitch: dynamics.rotation.x * 180 / Math.PI,
      yaw: dynamics.rotation.y * 180 / Math.PI,
      roll: dynamics.rotation.z * 180 / Math.PI
    };

    // Update derived flight parameters
    this.flightState.airspeed = Math.sqrt(
      dynamics.velocity.x ** 2 + 
      dynamics.velocity.y ** 2 + 
      dynamics.velocity.z ** 2
    ) * 1.94384; // m/s to knots

    this.flightState.groundSpeed = Math.sqrt(
      dynamics.velocity.x ** 2 + 
      dynamics.velocity.z ** 2
    ) * 1.94384; // m/s to knots

    this.flightState.heading = ((dynamics.rotation.y * 180 / Math.PI) + 360) % 360;
    this.flightState.verticalSpeed = dynamics.velocity.y * 196.85; // m/s to fpm
  }

  private updateAutopilot(deltaTime: number): void {
    const ap = this.flightState.autopilot;
    
    if (!ap.engaged) return;

    // Altitude hold
    const altitudeError = ap.targetAltitude - this.flightState.position.altitude;
    if (Math.abs(altitudeError) > 100) {
      const climbRate = Math.sign(altitudeError) * Math.min(2000, Math.abs(altitudeError) / 10);
      this.controls.pitch = climbRate / 6000; // Convert to pitch input
    } else {
      this.controls.pitch = 0;
    }

    // Heading hold
    const headingError = this.normalizeHeading(ap.targetHeading - this.flightState.heading);
    if (Math.abs(headingError) > 2) {
      this.controls.roll = Math.sign(headingError) * Math.min(0.3, Math.abs(headingError) / 30);
    } else {
      this.controls.roll = 0;
    }

    // Speed hold
    const speedError = ap.targetSpeed - this.flightState.airspeed;
    if (Math.abs(speedError) > 5) {
      const throttleAdjustment = speedError / 100; // Convert to throttle input
      this.controls.throttle = Math.max(0, Math.min(100, this.controls.throttle + throttleAdjustment));
    }
  }

  private normalizeHeading(heading: number): number {
    while (heading > 180) heading -= 360;
    while (heading < -180) heading += 360;
    return heading;
  }

  private updateFuelConsumption(deltaTime: number): void {
    const fuelConsumption = FlightEnvelope.calculateFuelConsumption(
      this.flightState.position.altitude,
      this.flightState.airspeed / 661.47, // Convert to Mach
      this.flightState.weight,
      'cruise'
    );

    const fuelUsed = (fuelConsumption / 3600) * deltaTime; // kg/hour to kg/second
    this.flightState.fuelRemaining = Math.max(0, this.flightState.fuelRemaining - fuelUsed);
    this.flightState.weight = boeing787Specs.weights.operatingEmptyWeight + this.flightState.fuelRemaining;
    
    this.flightState.performance.fuelConsumption = fuelConsumption;
  }

  private updateEngineParameters(): void {
    this.flightState.engines.forEach((engine, index) => {
      // Update thrust based on throttle
      engine.thrust = this.controls.throttle;
      
      // Update temperature based on throttle and altitude
      const baseTemp = 400 + (this.controls.throttle / 100) * 350;
      const altitudeEffect = this.flightState.position.altitude / 1000 * -5;
      engine.temperature = baseTemp + altitudeEffect + (Math.random() - 0.5) * 10;
      
      // Update fuel flow
      const thrustFactor = this.controls.throttle / 100;
      const altitudeFactor = 1 - (this.flightState.position.altitude / 100000);
      engine.fuelFlow = 1000 + (thrustFactor * 2000) + (altitudeFactor * 500);
    });
  }

  private updatePerformanceMetrics(): void {
    const perf = this.flightState.performance;
    
    // Update range based on current fuel and consumption
    perf.range = (this.flightState.fuelRemaining / perf.fuelConsumption) * this.flightState.groundSpeed;
    
    // Update endurance
    perf.endurance = this.flightState.fuelRemaining / perf.fuelConsumption;
  }

  private applyWeatherEffects(): void {
    const weather = this.flightState.weather;
    
    // Simple wind effect on ground speed
    const windEffect = weather.windSpeed * Math.cos((weather.windDirection - this.flightState.heading) * Math.PI / 180);
    this.flightState.groundSpeed = this.flightState.airspeed + windEffect;
    
    // Turbulence effects
    if (weather.turbulence !== 'none') {
      const turbulenceIntensity = {
        'light': 0.1,
        'moderate': 0.3,
        'severe': 0.6
      }[weather.turbulence] || 0;
      
      // Add random turbulence to controls (simplified)
      if (!this.controls.autopilot) {
        this.controls.pitch += (Math.random() - 0.5) * turbulenceIntensity * 0.1;
        this.controls.roll += (Math.random() - 0.5) * turbulenceIntensity * 0.1;
      }
    }
  }

  private checkSystemWarnings(): void {
    const warnings: string[] = [];
    
    // Fuel warnings
    if (this.flightState.fuelRemaining < 10000) {
      warnings.push("LOW FUEL");
    }
    
    // Engine temperature warnings
    this.flightState.engines.forEach((engine, index) => {
      if (engine.temperature > 900) {
        warnings.push(`ENGINE ${index + 1} HIGH TEMP`);
      }
    });
    
    // Altitude warnings
    if (this.flightState.position.altitude > boeing787Specs.performance.maxOperatingAltitude) {
      warnings.push("ALTITUDE LIMIT EXCEEDED");
    }
    
    // Speed warnings
    const maxSpeed = boeing787Specs.performance.maxCruiseSpeed * 661.47; // Convert Mach to knots
    if (this.flightState.airspeed > maxSpeed) {
      warnings.push("OVERSPEED");
    }
    
    // Log warnings if any
    if (warnings.length > 0) {
      console.warn("Flight warnings:", warnings);
    }
  }

  // Public interface methods
  public updateControls(newControls: Partial<FlightControls>): void {
    this.controls = { ...this.controls, ...newControls };
    
    // Update autopilot engagement
    if (newControls.autopilot !== undefined) {
      this.flightState.autopilot.engaged = newControls.autopilot;
      if (newControls.autopilot) {
        // Set autopilot targets to current values
        this.flightState.autopilot.targetAltitude = this.flightState.position.altitude;
        this.flightState.autopilot.targetHeading = this.flightState.heading;
        this.flightState.autopilot.targetSpeed = this.flightState.airspeed;
      }
    }
    
    console.log("Flight controls updated:", this.controls);
  }

  public declareEmergency(type: string, details?: any): void {
    this.flightState.emergency = {
      declared: true,
      type,
      startTime: new Date()
    };
    
    // Emergency-specific responses
    switch (type.toLowerCase()) {
      case 'medical':
        // Prepare for potential diversion
        this.flightState.autopilot.mode = "EMERGENCY";
        break;
      case 'engine':
        // Reduce throttle on affected engine
        this.controls.throttle = Math.min(80, this.controls.throttle);
        break;
      case 'pressurization':
        // Emergency descent
        this.flightState.autopilot.targetAltitude = 10000;
        break;
    }
    
    console.log(`Emergency declared: ${type}`, details);
  }

  public clearEmergency(): void {
    this.flightState.emergency = {
      declared: false,
      type: null,
      startTime: null
    };
    
    this.flightState.autopilot.mode = "CRUISE";
    console.log("Emergency cleared");
  }

  public setAutopilotTarget(type: 'altitude' | 'heading' | 'speed', value: number): void {
    switch (type) {
      case 'altitude':
        this.flightState.autopilot.targetAltitude = Math.max(0, Math.min(45000, value));
        break;
      case 'heading':
        this.flightState.autopilot.targetHeading = value % 360;
        break;
      case 'speed':
        this.flightState.autopilot.targetSpeed = Math.max(100, Math.min(600, value));
        break;
    }
    
    console.log(`Autopilot target ${type} set to ${value}`);
  }

  public getFlightState(): FlightState {
    return { ...this.flightState };
  }

  public getControls(): FlightControls {
    return { ...this.controls };
  }

  public isActive(): boolean {
    return this.active;
  }

  public pause(): void {
    this.active = false;
  }

  public resume(): void {
    this.active = true;
    this.lastUpdate = Date.now();
  }

  public reset(): void {
    this.physicsEngine = new FlightPhysicsEngine();
    this.lastUpdate = Date.now();
    
    // Reset to initial state
    this.flightState.position = { lat: 34.0522, lon: -118.2437, altitude: 35000 };
    this.flightState.fuelRemaining = 120000;
    this.flightState.weight = 220000;
    this.flightState.emergency = { declared: false, type: null, startTime: null };
    
    this.controls = {
      throttle: 75,
      pitch: 0,
      roll: 0,
      yaw: 0,
      autopilot: true
    };
    
    console.log("Flight simulation reset");
  }

  // Diversion calculations
  public calculateDiversionOptions(targetLat: number, targetLon: number): {
    distance: number;
    bearing: number;
    flightTime: number;
    fuelRequired: number;
    fuelSufficient: boolean;
  } {
    const currentLat = this.flightState.position.lat;
    const currentLon = this.flightState.position.lon;
    
    // Calculate great circle distance
    const R = 3440.065; // Earth radius in nautical miles
    const dLat = (targetLat - currentLat) * Math.PI / 180;
    const dLon = (targetLon - currentLon) * Math.PI / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(currentLat * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    // Calculate bearing
    const y = Math.sin(dLon) * Math.cos(targetLat * Math.PI / 180);
    const x = Math.cos(currentLat * Math.PI / 180) * Math.sin(targetLat * Math.PI / 180) -
      Math.sin(currentLat * Math.PI / 180) * Math.cos(targetLat * Math.PI / 180) * Math.cos(dLon);
    const bearing = (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
    
    // Calculate flight time and fuel
    const flightTime = distance / this.flightState.groundSpeed; // hours
    const fuelRequired = this.flightState.performance.fuelConsumption * flightTime;
    const fuelSufficient = fuelRequired < (this.flightState.fuelRemaining * 0.9); // Keep 10% reserve
    
    return {
      distance,
      bearing,
      flightTime: flightTime * 60, // Convert to minutes
      fuelRequired,
      fuelSufficient
    };
  }
}

