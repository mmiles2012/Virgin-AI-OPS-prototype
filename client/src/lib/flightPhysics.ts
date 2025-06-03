import * as THREE from 'three';

export interface FlightDynamics {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  rotation: THREE.Euler;
  angularVelocity: THREE.Vector3;
  mass: number;
  thrust: number;
  drag: number;
  lift: number;
}

export class FlightPhysicsEngine {
  private dynamics: FlightDynamics;
  
  constructor(initialPosition: THREE.Vector3 = new THREE.Vector3(0, 35000, 0)) {
    this.dynamics = {
      position: initialPosition.clone(),
      velocity: new THREE.Vector3(0, 0, -485), // Initial cruising speed
      rotation: new THREE.Euler(0, 0, 0),
      angularVelocity: new THREE.Vector3(0, 0, 0),
      mass: 220000, // Boeing 787 typical mass in kg
      thrust: 0,
      drag: 0,
      lift: 0
    };
  }

  // Update flight dynamics
  update(deltaTime: number, controls: {
    throttle: number;
    pitch: number;
    roll: number;
    yaw: number;
  }): FlightDynamics {
    // Calculate forces
    this.calculateThrust(controls.throttle);
    this.calculateDrag();
    this.calculateLift();
    
    // Apply control inputs
    this.applyControlInputs(controls, deltaTime);
    
    // Update velocity and position
    this.updateVelocity(deltaTime);
    this.updatePosition(deltaTime);
    
    // Apply atmospheric effects
    this.applyAtmosphericEffects();
    
    return { ...this.dynamics };
  }

  private calculateThrust(throttlePercent: number): void {
    // Boeing 787 engines: approximately 64,000 lbf each
    const maxThrust = 569440; // Newtons (2 engines)
    this.dynamics.thrust = (throttlePercent / 100) * maxThrust;
  }

  private calculateDrag(): void {
    const airDensity = this.getAirDensity(this.dynamics.position.y);
    const velocity = this.dynamics.velocity.length();
    const dragCoefficient = 0.024; // Boeing 787 approximation
    const referenceArea = 325; // m²
    
    this.dynamics.drag = 0.5 * airDensity * velocity * velocity * dragCoefficient * referenceArea;
  }

  private calculateLift(): void {
    const airDensity = this.getAirDensity(this.dynamics.position.y);
    const velocity = this.dynamics.velocity.length();
    const liftCoefficient = this.getLiftCoefficient();
    const wingArea = 325; // m²
    
    this.dynamics.lift = 0.5 * airDensity * velocity * velocity * liftCoefficient * wingArea;
  }

  private getLiftCoefficient(): number {
    // Simplified lift coefficient calculation based on angle of attack
    const angleOfAttack = this.dynamics.rotation.x;
    return Math.sin(angleOfAttack + Math.PI / 12) * 1.2; // Optimized for cruise
  }

  private getAirDensity(altitude: number): number {
    // Standard atmosphere model (simplified)
    const seaLevelDensity = 1.225; // kg/m³
    const scaleHeight = 8000; // meters
    return seaLevelDensity * Math.exp(-altitude / scaleHeight);
  }

  private applyControlInputs(controls: {
    throttle: number;
    pitch: number;
    roll: number;
    yaw: number;
  }, deltaTime: number): void {
    // Angular control inputs
    const controlAuthority = 0.5; // Control effectiveness factor
    
    this.dynamics.angularVelocity.x += controls.pitch * controlAuthority * deltaTime;
    this.dynamics.angularVelocity.y += controls.yaw * controlAuthority * deltaTime;
    this.dynamics.angularVelocity.z += controls.roll * controlAuthority * deltaTime;
    
    // Apply damping
    this.dynamics.angularVelocity.multiplyScalar(0.95);
    
    // Update rotation
    this.dynamics.rotation.x += this.dynamics.angularVelocity.x * deltaTime;
    this.dynamics.rotation.y += this.dynamics.angularVelocity.y * deltaTime;
    this.dynamics.rotation.z += this.dynamics.angularVelocity.z * deltaTime;
    
    // Limit control surface deflections
    this.dynamics.rotation.x = THREE.MathUtils.clamp(this.dynamics.rotation.x, -Math.PI/6, Math.PI/6);
    this.dynamics.rotation.z = THREE.MathUtils.clamp(this.dynamics.rotation.z, -Math.PI/4, Math.PI/4);
  }

  private updateVelocity(deltaTime: number): void {
    // Net force calculation
    const thrustForce = new THREE.Vector3(0, 0, -this.dynamics.thrust);
    const dragForce = this.dynamics.velocity.clone().normalize().multiplyScalar(-this.dynamics.drag);
    const liftForce = new THREE.Vector3(0, this.dynamics.lift, 0);
    const weightForce = new THREE.Vector3(0, -this.dynamics.mass * 9.81, 0);
    
    // Transform thrust to world coordinates
    thrustForce.applyEuler(this.dynamics.rotation);
    
    // Sum forces
    const netForce = new THREE.Vector3()
      .add(thrustForce)
      .add(dragForce)
      .add(liftForce)
      .add(weightForce);
    
    // F = ma
    const acceleration = netForce.divideScalar(this.dynamics.mass);
    
    // Update velocity
    this.dynamics.velocity.add(acceleration.multiplyScalar(deltaTime));
  }

  private updatePosition(deltaTime: number): void {
    // Update position based on velocity
    const deltaPosition = this.dynamics.velocity.clone().multiplyScalar(deltaTime);
    this.dynamics.position.add(deltaPosition);
    
    // Ensure aircraft doesn't go below ground
    this.dynamics.position.y = Math.max(0, this.dynamics.position.y);
  }

  private applyAtmosphericEffects(): void {
    // Turbulence simulation (simplified)
    if (this.dynamics.position.y < 15000) {
      const turbulenceStrength = 0.1;
      this.dynamics.velocity.add(new THREE.Vector3(
        (Math.random() - 0.5) * turbulenceStrength,
        (Math.random() - 0.5) * turbulenceStrength,
        (Math.random() - 0.5) * turbulenceStrength
      ));
    }
  }

  // Getters for flight parameters
  getAirspeed(): number {
    return this.dynamics.velocity.length() * 1.94384; // Convert m/s to knots
  }

  getAltitude(): number {
    return this.dynamics.position.y * 3.28084; // Convert meters to feet
  }

  getHeading(): number {
    return ((this.dynamics.rotation.y * 180 / Math.PI) + 360) % 360;
  }

  getMachNumber(): number {
    const speedOfSound = this.getSpeedOfSound(this.dynamics.position.y);
    return this.dynamics.velocity.length() / speedOfSound;
  }

  private getSpeedOfSound(altitude: number): number {
    // Speed of sound calculation (simplified)
    const temperature = 288.15 - 0.0065 * altitude; // Standard atmosphere
    return Math.sqrt(1.4 * 287 * temperature);
  }

  // Fuel consumption calculation
  calculateFuelConsumption(deltaTime: number): number {
    // Simplified fuel consumption based on thrust
    const thrustPercent = this.dynamics.thrust / 569440;
    const baseFuelFlow = 2.5; // kg/s per engine at cruise
    const fuelFlow = baseFuelFlow * 2 * (0.3 + 0.7 * thrustPercent); // Two engines
    return fuelFlow * deltaTime;
  }

  // Emergency calculations
  calculateGlideDistance(): number {
    const altitude = this.dynamics.position.y;
    const glideRatio = 17; // Boeing 787 approximate glide ratio
    return altitude * glideRatio;
  }

  calculateMinimumRunwayLength(): number {
    const weight = this.dynamics.mass;
    const velocity = this.dynamics.velocity.length();
    // Simplified landing distance calculation
    return (weight / 1000) * 3.5 + (velocity / 10) * 100;
  }
}
