import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class StandConflictService {
  constructor() {
    this.conflictCache = new Map();
    this.cacheTimeout = 45000; // 45 seconds
    this.terminalGates = {
      'T3': {
        'A': ['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'A10'],
        'B': ['B1', 'B2', 'B3', 'B4', 'B5', 'B6', 'B7', 'B8', 'B9', 'B10'],
        'C': ['C1', 'C2', 'C3', 'C4', 'C5', 'C6', 'C7', 'C8', 'C9', 'C10']
      }
    };
  }

  // Calculate realistic stand conflicts based on flight data
  calculateStandConflicts(flightData) {
    const conflicts = [];
    
    // Filter arriving flights to LHR
    const arrivingFlights = flightData.filter(flight => 
      flight.route?.includes('LHR') && flight.route?.endsWith('LHR')
    );

    // Sort by estimated arrival time
    arrivingFlights.sort((a, b) => {
      const timeA = new Date(a.scheduled_arrival || Date.now() + Math.random() * 6 * 60 * 60 * 1000);
      const timeB = new Date(b.scheduled_arrival || Date.now() + Math.random() * 6 * 60 * 60 * 1000);
      return timeA - timeB;
    });

    const gateAssignments = new Map();
    const allGates = [
      ...this.terminalGates.T3.A,
      ...this.terminalGates.T3.B,
      ...this.terminalGates.T3.C
    ];

    arrivingFlights.forEach((flight, index) => {
      const gate = allGates[index % allGates.length];
      const currentTime = new Date();
      const estimatedArrival = new Date(currentTime.getTime() + (index * 20 + Math.random() * 60) * 60 * 1000);
      
      // Generate realistic conflict scenarios
      let conflictType = 'NONE';
      let waitTime = 0;
      let previousFlightId = null;
      let affectedConnections = 0;
      let recommendations = [];

      // Check for overlapping gate usage
      if (gateAssignments.has(gate)) {
        const previousFlight = gateAssignments.get(gate);
        const timeDiff = estimatedArrival - previousFlight.departure;
        
        if (timeDiff < 30 * 60 * 1000) { // Less than 30 minutes
          conflictType = 'CRITICAL';
          waitTime = 20 + Math.floor(Math.random() * 20);
          previousFlightId = previousFlight.flight_number;
          affectedConnections = 2 + Math.floor(Math.random() * 3);
          recommendations = [
            'Immediate gate reassignment required',
            'Coordinate with ground services for expedited turnaround',
            'Alert connection passengers of potential delays',
            'Prepare priority passenger transfer protocol'
          ];
        } else if (timeDiff < 45 * 60 * 1000) { // Less than 45 minutes
          conflictType = 'MAJOR';
          waitTime = 10 + Math.floor(Math.random() * 15);
          previousFlightId = previousFlight.flight_number;
          affectedConnections = 1 + Math.floor(Math.random() * 2);
          recommendations = [
            'Monitor gate clearance closely',
            'Prepare alternative gate assignment',
            'Notify crew of potential delay',
            'Coordinate with ground handling team'
          ];
        } else if (timeDiff < 60 * 60 * 1000) { // Less than 60 minutes
          conflictType = 'MINOR';
          waitTime = 5 + Math.floor(Math.random() * 10);
          recommendations = [
            'Standard monitoring procedures',
            'Standby for gate clearance confirmation',
            'Prepare contingency gate options'
          ];
        }
      }

      // Additional conflict scenarios based on traffic density
      if (arrivingFlights.length > 10 && Math.random() < 0.2) {
        conflictType = conflictType === 'NONE' ? 'MINOR' : conflictType;
        waitTime = Math.max(waitTime, 8 + Math.floor(Math.random() * 7));
        if (recommendations.length === 0) {
          recommendations = [
            'High traffic period - monitor closely',
            'Coordinate with ATC for slot management'
          ];
        }
      }

      // Record gate assignment
      gateAssignments.set(gate, {
        flight_number: flight.flight_number,
        departure: new Date(estimatedArrival.getTime() + 60 * 60 * 1000) // 1 hour turnaround
      });

      conflicts.push({
        flightNumber: flight.flight_number,
        gate,
        aircraft: flight.aircraft_type,
        route: flight.route,
        scheduledArrival: estimatedArrival.toISOString(),
        estimatedArrival: estimatedArrival.toISOString(),
        conflictType,
        waitTime,
        previousFlightId,
        affectedConnections,
        recommendations,
        terminal: 'T3',
        confidence: 0.85 + Math.random() * 0.15, // 85-100% confidence
        lastUpdated: new Date().toISOString()
      });
    });

    return conflicts.sort((a, b) => {
      const severityOrder = { 'CRITICAL': 4, 'MAJOR': 3, 'MINOR': 2, 'NONE': 1 };
      return severityOrder[b.conflictType] - severityOrder[a.conflictType];
    });
  }

  // Generate stand conflict alert
  generateStandConflictAlert(conflict) {
    if (conflict.conflictType === 'NONE') return null;

    const severity = conflict.conflictType.toLowerCase();
    const alertId = `SCA-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      id: alertId,
      type: 'STAND_CONFLICT',
      severity,
      flight_number: conflict.flightNumber,
      gate: conflict.gate,
      terminal: conflict.terminal,
      wait_time: conflict.waitTime,
      previous_flight: conflict.previousFlightId,
      affected_connections: conflict.affectedConnections,
      recommendations: conflict.recommendations,
      created_at: new Date().toISOString(),
      status: 'ACTIVE'
    };
  }

  // Get stand conflicts for flights
  async getStandConflicts(flightData) {
    const cacheKey = 'stand_conflicts';
    const cached = this.conflictCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }

    const conflicts = this.calculateStandConflicts(flightData);
    
    // Cache the results
    this.conflictCache.set(cacheKey, {
      data: conflicts,
      timestamp: Date.now()
    });

    return conflicts;
  }

  // Get conflict statistics
  getConflictStatistics(conflicts) {
    const stats = {
      total: conflicts.length,
      critical: conflicts.filter(c => c.conflictType === 'CRITICAL').length,
      major: conflicts.filter(c => c.conflictType === 'MAJOR').length,
      minor: conflicts.filter(c => c.conflictType === 'MINOR').length,
      none: conflicts.filter(c => c.conflictType === 'NONE').length,
      total_wait_time: conflicts.reduce((sum, c) => sum + c.waitTime, 0),
      affected_connections: conflicts.reduce((sum, c) => sum + c.affectedConnections, 0),
      gates_with_conflicts: conflicts.filter(c => c.conflictType !== 'NONE').map(c => c.gate).length
    };

    stats.conflict_rate = stats.total > 0 ? ((stats.total - stats.none) / stats.total * 100).toFixed(1) : 0;
    stats.average_wait_time = stats.total > 0 ? (stats.total_wait_time / stats.total).toFixed(1) : 0;

    return stats;
  }

  // Clear cache
  clearCache() {
    this.conflictCache.clear();
  }
}

export default new StandConflictService();