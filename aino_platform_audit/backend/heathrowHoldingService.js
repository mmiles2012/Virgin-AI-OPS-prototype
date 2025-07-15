/**
 * Heathrow Airborne Holding Areas Service for AINO Platform
 * Detects aircraft in holding patterns at BNN, BIG, LAM, and OCK stacks
 */

class HeathrowHoldingService {
  constructor() {
    // Official Heathrow holding areas (lat/lon coordinates)
    this.HOLDING_STACKS = {
      "BNN": { 
        name: "Bovington", 
        lat: 51.7969, 
        lon: -0.6467,
        radius: 20, // km
        minAltitude: 7000,
        maxAltitude: 15000
      },
      "BIG": { 
        name: "Biggin Hill", 
        lat: 51.3300, 
        lon: 0.0325,
        radius: 20,
        minAltitude: 7000,
        maxAltitude: 15000
      },
      "LAM": { 
        name: "Lambourne", 
        lat: 51.6500, 
        lon: 0.1550,
        radius: 20,
        minAltitude: 7000,
        maxAltitude: 15000
      },
      "OCK": { 
        name: "Ockham", 
        lat: 51.2690, 
        lon: -0.4810,
        radius: 20,
        minAltitude: 7000,
        maxAltitude: 15000
      }
    };
    
    this.flightHistory = new Map(); // Track flight positions over time
    this.holdingDetections = new Map(); // Current holding detections
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radius in km
    const phi1 = lat1 * Math.PI / 180;
    const phi2 = lat2 * Math.PI / 180;
    const deltaPhi = (lat2 - lat1) * Math.PI / 180;
    const deltaLambda = (lon2 - lon1) * Math.PI / 180;
    
    const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
              Math.cos(phi1) * Math.cos(phi2) *
              Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    
    return R * c;
  }

  /**
   * Determine which holding stack (if any) an aircraft is in
   */
  assignHoldingStack(lat, lon, altitude) {
    for (const [stackCode, stack] of Object.entries(this.HOLDING_STACKS)) {
      const distance = this.calculateDistance(lat, lon, stack.lat, stack.lon);
      
      if (distance <= stack.radius && 
          altitude >= stack.minAltitude && 
          altitude <= stack.maxAltitude) {
        return {
          stack: stackCode,
          name: stack.name,
          distance: distance,
          inStack: true
        };
      }
    }
    return { stack: null, name: null, distance: null, inStack: false };
  }

  /**
   * Detect holding patterns based on flight history
   */
  detectHoldingPattern(flightNumber, currentPosition) {
    const { lat, lon, altitude, heading, velocity } = currentPosition;
    
    // Initialize flight history if not exists
    if (!this.flightHistory.has(flightNumber)) {
      this.flightHistory.set(flightNumber, []);
    }
    
    const history = this.flightHistory.get(flightNumber);
    
    // Add current position to history
    history.push({
      timestamp: new Date(),
      lat,
      lon,
      altitude,
      heading,
      velocity
    });
    
    // Keep only last 10 positions (about 5 minutes at 30-second intervals)
    if (history.length > 10) {
      history.shift();
    }
    
    // Need at least 3 positions to detect holding
    if (history.length < 3) {
      return { isHolding: false, confidence: 0 };
    }
    
    // Calculate altitude variation
    const altitudes = history.map(p => p.altitude);
    const altitudeRange = Math.max(...altitudes) - Math.min(...altitudes);
    
    // Calculate heading variation
    const headings = history.map(p => p.heading);
    const headingRange = Math.max(...headings) - Math.min(...headings);
    
    // Calculate velocity variation
    const velocities = history.map(p => p.velocity);
    const avgVelocity = velocities.reduce((a, b) => a + b, 0) / velocities.length;
    
    // Holding pattern criteria:
    // 1. Low altitude variation (< 300 feet)
    // 2. High heading variation (> 90 degrees - indicating turns)
    // 3. Relatively low speed (< 250 knots)
    const isHolding = altitudeRange < 300 && headingRange > 90 && avgVelocity < 250;
    
    // Calculate confidence based on how well criteria are met
    let confidence = 0;
    if (altitudeRange < 300) confidence += 0.4;
    if (headingRange > 90) confidence += 0.4;
    if (avgVelocity < 250) confidence += 0.2;
    
    return { isHolding, confidence };
  }

  /**
   * Process flight data and detect holding patterns
   */
  processFlightData(flights) {
    const processedFlights = [];
    const holdingSummary = {
      totalHolding: 0,
      stackCounts: { BNN: 0, BIG: 0, LAM: 0, OCK: 0 },
      alerts: []
    };
    
    for (const flight of flights) {
      const { flight_number, latitude, longitude, altitude, heading, velocity } = flight;
      
      if (!latitude || !longitude || !altitude) {
        processedFlights.push({ ...flight, holding: null });
        continue;
      }
      
      // Check if in holding stack area
      const stackInfo = this.assignHoldingStack(latitude, longitude, altitude);
      
      // Detect holding pattern
      const holdingDetection = this.detectHoldingPattern(flight_number, {
        lat: latitude,
        lon: longitude,
        altitude,
        heading: heading || 0,
        velocity: velocity || 0
      });
      
      const isHolding = stackInfo.inStack && holdingDetection.isHolding;
      
      if (isHolding) {
        holdingSummary.totalHolding++;
        holdingSummary.stackCounts[stackInfo.stack]++;
        
        // Store detection
        this.holdingDetections.set(flight_number, {
          stack: stackInfo.stack,
          stackName: stackInfo.name,
          confidence: holdingDetection.confidence,
          detectedAt: new Date(),
          altitude,
          distance: stackInfo.distance
        });
        
        // Generate alert if confidence is high
        if (holdingDetection.confidence > 0.7) {
          holdingSummary.alerts.push({
            type: 'HOLDING_DETECTED',
            priority: 'HIGH',
            flight: flight_number,
            stack: stackInfo.stack,
            stackName: stackInfo.name,
            confidence: holdingDetection.confidence,
            message: `${flight_number} detected in holding pattern at ${stackInfo.name} (${stackInfo.stack})`
          });
        }
      } else {
        // Remove from holding detections if no longer holding
        this.holdingDetections.delete(flight_number);
      }
      
      processedFlights.push({
        ...flight,
        holding: {
          isHolding,
          stack: stackInfo.stack,
          stackName: stackInfo.name,
          confidence: holdingDetection.confidence,
          distance: stackInfo.distance
        }
      });
    }
    
    return { flights: processedFlights, summary: holdingSummary };
  }

  /**
   * Get current holding status
   */
  getHoldingStatus() {
    const activeHoldings = Array.from(this.holdingDetections.entries()).map(([flight, detection]) => ({
      flight,
      ...detection
    }));
    
    const stackCounts = { BNN: 0, BIG: 0, LAM: 0, OCK: 0 };
    activeHoldings.forEach(holding => {
      stackCounts[holding.stack]++;
    });
    
    return {
      totalHolding: activeHoldings.length,
      stackCounts,
      activeHoldings,
      stacks: this.HOLDING_STACKS
    };
  }

  /**
   * Check for holding alerts
   */
  checkHoldingAlerts(threshold = 5) {
    const status = this.getHoldingStatus();
    const alerts = [];
    
    if (status.totalHolding >= threshold) {
      alerts.push({
        type: 'HIGH_HOLDING_VOLUME',
        priority: 'CRITICAL',
        message: `${status.totalHolding} aircraft in holding patterns at Heathrow (threshold: ${threshold})`,
        details: status.stackCounts
      });
    }
    
    // Check individual stack congestion
    Object.entries(status.stackCounts).forEach(([stack, count]) => {
      if (count >= 3) {
        alerts.push({
          type: 'STACK_CONGESTION',
          priority: 'HIGH',
          stack,
          stackName: this.HOLDING_STACKS[stack].name,
          count,
          message: `${count} aircraft holding at ${this.HOLDING_STACKS[stack].name} (${stack})`
        });
      }
    });
    
    return alerts;
  }

  /**
   * Get holding areas for map display
   */
  getHoldingAreas() {
    return Object.entries(this.HOLDING_STACKS).map(([code, stack]) => ({
      code,
      name: stack.name,
      lat: stack.lat,
      lon: stack.lon,
      radius: stack.radius,
      minAltitude: stack.minAltitude,
      maxAltitude: stack.maxAltitude,
      currentCount: this.holdingDetections.size > 0 ? 
        Array.from(this.holdingDetections.values()).filter(d => d.stack === code).length : 0
    }));
  }

  /**
   * Clear old flight history (cleanup)
   */
  cleanupHistory() {
    const cutoffTime = new Date(Date.now() - 10 * 60 * 1000); // 10 minutes ago
    
    for (const [flightNumber, history] of this.flightHistory.entries()) {
      const filteredHistory = history.filter(pos => pos.timestamp > cutoffTime);
      
      if (filteredHistory.length === 0) {
        this.flightHistory.delete(flightNumber);
        this.holdingDetections.delete(flightNumber);
      } else {
        this.flightHistory.set(flightNumber, filteredHistory);
      }
    }
  }

  /**
   * Get comprehensive holding analysis for ML integration
   * This function is required by the integrated ML service
   */
  async getHoldingAnalysis(flights) {
    try {
      // Process current flight data
      const analysis = this.processFlightData(flights);
      const status = this.getHoldingStatus();
      const alerts = this.checkHoldingAlerts();
      const areas = this.getHoldingAreas();
      
      // Create comprehensive holding analysis structure
      return {
        timestamp: new Date().toISOString(),
        holding_status: status,
        holding_analysis: analysis,
        holding_alerts: alerts,
        holding_areas: areas,
        summary: {
          totalHolding: status.totalHolding,
          stackCounts: status.stackCounts,
          alerts: alerts
        },
        // ML-ready data structure
        ml_data: {
          total_aircraft_holding: status.totalHolding,
          stack_distribution: status.stackCounts,
          estimated_delay_minutes: this.calculateAverageHoldingDelay(status.activeHoldings),
          affected_routes: this.getAffectedRoutes(status.activeHoldings),
          holding_efficiency: this.calculateHoldingEfficiency(status)
        }
      };
    } catch (error) {
      console.error('Error generating holding analysis:', error);
      return {
        timestamp: new Date().toISOString(),
        holding_status: { totalHolding: 0, stackCounts: {}, activeHoldings: [] },
        holding_analysis: { summary: { totalHolding: 0, stackCounts: {}, alerts: [] }},
        holding_alerts: [],
        holding_areas: this.getHoldingAreas(),
        summary: { totalHolding: 0, stackCounts: {}, alerts: [] },
        ml_data: {
          total_aircraft_holding: 0,
          stack_distribution: {},
          estimated_delay_minutes: 0,
          affected_routes: [],
          holding_efficiency: 1.0
        },
        error: error.message
      };
    }
  }

  /**
   * Calculate average holding delay for ML analysis
   */
  calculateAverageHoldingDelay(activeHoldings) {
    if (!activeHoldings || activeHoldings.length === 0) return 0;
    
    // Estimate delay based on holding duration and pattern
    const totalDelay = activeHoldings.reduce((sum, holding) => {
      // Base delay estimation: 5-20 minutes depending on holding confidence
      const baseDelay = 5 + (holding.confidence * 15);
      return sum + baseDelay;
    }, 0);
    
    return Math.round(totalDelay / activeHoldings.length);
  }

  /**
   * Get affected routes for ML analysis
   */
  getAffectedRoutes(activeHoldings) {
    if (!activeHoldings || activeHoldings.length === 0) return [];
    
    return activeHoldings.map(holding => ({
      flight_number: holding.flight_number,
      route: holding.route || 'UNKNOWN-LHR',
      aircraft_type: holding.aircraft_type || 'UNKNOWN',
      holding_stack: holding.stack,
      estimated_delay: this.calculateAverageHoldingDelay([holding])
    }));
  }

  /**
   * Calculate holding efficiency for ML analysis
   */
  calculateHoldingEfficiency(status) {
    const totalCapacity = Object.keys(this.HOLDING_STACKS).length * 5; // Assume 5 aircraft capacity per stack
    const currentOccupancy = status.totalHolding;
    
    if (currentOccupancy === 0) return 1.0;
    
    // Efficiency decreases as occupancy increases
    const utilizationRate = currentOccupancy / totalCapacity;
    return Math.max(0.2, 1.0 - (utilizationRate * 0.8));
  }
}

const heathrowHoldingService = new HeathrowHoldingService();
export default heathrowHoldingService;