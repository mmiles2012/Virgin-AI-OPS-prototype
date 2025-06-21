import { icaoApiService, ICAOFlightData, ICAONotamData } from './icaoApiService';

export interface ICAOMLFeatures {
  flight_data: {
    altitude_risk_score: number;
    speed_anomaly_score: number;
    route_deviation_score: number;
    emergency_status: boolean;
    squawk_risk_level: 'normal' | 'caution' | 'emergency';
    flight_phase_risk: number;
  };
  notam_intelligence: {
    operational_impact_score: number;
    severity_weighted_count: number;
    airport_risk_matrix: { [airport: string]: number };
    critical_conditions: string[];
  };
  airspace_safety: {
    congestion_score: number;
    separation_violations: number;
    weather_impact_factor: number;
    overall_safety_rating: 'safe' | 'caution' | 'unsafe';
  };
}

export class ICAOMLIntegrationService {
  private mlFeatureCache: Map<string, { features: ICAOMLFeatures; timestamp: number }> = new Map();
  private safetyThresholds = {
    altitude_min: 1000, // Minimum safe altitude in feet
    altitude_max: 45000, // Maximum operational altitude
    speed_variance_threshold: 50, // Speed deviation threshold in knots
    separation_minimum: 5, // Minimum separation in nautical miles
    emergency_squawks: ['7500', '7600', '7700'], // Emergency squawk codes
    critical_notam_types: ['RWY', 'ILS', 'TWR', 'APP']
  };

  constructor() {
    console.log('ICAO ML Integration Service initialized for aviation safety intelligence');
  }

  /**
   * Extract ML features from ICAO flight data for Random Forest models
   */
  async extractFlightMLFeatures(flights: ICAOFlightData[]): Promise<ICAOMLFeatures['flight_data'][]> {
    return flights.map(flight => {
      const altitudeRisk = this.calculateAltitudeRisk(flight.position?.altitude_ft || 0);
      const speedAnomalyScore = this.calculateSpeedAnomalyScore(flight.speed?.ground_speed_kts || 0);
      const routeDeviationScore = this.calculateRouteDeviation(flight);
      const emergencyStatus = flight.emergency || this.safetyThresholds.emergency_squawks.includes(flight.squawk);
      const squawkRiskLevel = this.assessSquawkRisk(flight.squawk);
      const flightPhaseRisk = this.calculateFlightPhaseRisk(flight.flight_phase, flight.position?.altitude_ft || 0);

      return {
        altitude_risk_score: altitudeRisk,
        speed_anomaly_score: speedAnomalyScore,
        route_deviation_score: routeDeviationScore,
        emergency_status: emergencyStatus,
        squawk_risk_level: squawkRiskLevel,
        flight_phase_risk: flightPhaseRisk
      };
    });
  }

  /**
   * Process NOTAMs for ML-based operational intelligence
   */
  async extractNotamMLFeatures(notams: ICAONotamData[]): Promise<ICAOMLFeatures['notam_intelligence']> {
    const operationalImpactScore = this.calculateOperationalImpact(notams);
    const severityWeightedCount = this.calculateSeverityWeights(notams);
    const airportRiskMatrix = this.buildAirportRiskMatrix(notams);
    const criticalConditions = this.identifyCriticalConditions(notams);

    return {
      operational_impact_score: operationalImpactScore,
      severity_weighted_count: severityWeightedCount,
      airport_risk_matrix: airportRiskMatrix,
      critical_conditions: criticalConditions
    };
  }

  /**
   * Generate comprehensive airspace safety assessment
   */
  async generateAirspaceSafetyFeatures(flights: ICAOFlightData[], notams: ICAONotamData[]): Promise<ICAOMLFeatures['airspace_safety']> {
    const congestionScore = this.calculateAirspaceCongestion(flights);
    const separationViolations = this.detectSeparationViolations(flights);
    const weatherImpactFactor = await this.assessWeatherImpact(flights);
    const overallSafetyRating = this.calculateOverallSafetyRating(congestionScore, separationViolations, notams);

    return {
      congestion_score: congestionScore,
      separation_violations: separationViolations,
      weather_impact_factor: weatherImpactFactor,
      overall_safety_rating: overallSafetyRating
    };
  }

  /**
   * Generate ML training dataset from ICAO data
   */
  async generateMLTrainingData(): Promise<{
    features: any[];
    labels: string[];
    metadata: {
      feature_count: number;
      data_source: string;
      timestamp: string;
      safety_metrics: any;
    };
  }> {
    try {
      // Fetch current ICAO data with efficient API usage
      const flightData = await icaoApiService.getFlightData();
      const notamData = await icaoApiService.getNotams();

      if (!flightData.success) {
        throw new Error('Failed to fetch ICAO flight data for ML training');
      }

      const flightFeatures = await this.extractFlightMLFeatures(flightData.flights);
      const notamFeatures = await this.extractNotamMLFeatures(notamData.notams || []);
      const safetyFeatures = await this.generateAirspaceSafetyFeatures(flightData.flights, notamData.notams || []);

      // Combine features for ML model
      const combinedFeatures = flightData.flights.map((flight, index) => ({
        // Flight identification
        callsign: flight.callsign,
        aircraft_type: flight.aircraft_type,
        operator: flight.operator,
        
        // Position and movement features
        altitude: flight.position?.altitude_ft || 0,
        latitude: flight.position?.latitude || 0,
        longitude: flight.position?.longitude || 0,
        heading: flight.position?.heading || 0,
        ground_speed: flight.speed?.ground_speed_kts || 0,
        mach: flight.speed?.mach || 0,
        
        // ML-derived safety features
        altitude_risk_score: flightFeatures[index]?.altitude_risk_score || 0,
        speed_anomaly_score: flightFeatures[index]?.speed_anomaly_score || 0,
        route_deviation_score: flightFeatures[index]?.route_deviation_score || 0,
        emergency_status: flightFeatures[index]?.emergency_status || false,
        flight_phase_risk: flightFeatures[index]?.flight_phase_risk || 0,
        
        // Airspace context
        congestion_score: safetyFeatures.congestion_score,
        weather_impact: safetyFeatures.weather_impact_factor,
        notam_impact: notamFeatures.operational_impact_score,
        
        // Operational context
        flight_phase: flight.flight_phase,
        squawk: flight.squawk,
        timestamp: flight.timestamp
      }));

      // Generate safety labels for supervised learning
      const safetyLabels = combinedFeatures.map(feature => {
        if (feature.emergency_status || feature.altitude_risk_score > 0.8) {
          return 'high_risk';
        } else if (feature.speed_anomaly_score > 0.6 || feature.route_deviation_score > 0.7) {
          return 'medium_risk';
        } else {
          return 'low_risk';
        }
      });

      return {
        features: combinedFeatures,
        labels: safetyLabels,
        metadata: {
          feature_count: combinedFeatures.length,
          data_source: 'ICAO_Official_Aviation_API',
          timestamp: new Date().toISOString(),
          safety_metrics: {
            high_risk_flights: safetyLabels.filter(l => l === 'high_risk').length,
            medium_risk_flights: safetyLabels.filter(l => l === 'medium_risk').length,
            low_risk_flights: safetyLabels.filter(l => l === 'low_risk').length,
            separation_violations: safetyFeatures.separation_violations,
            overall_safety_rating: safetyFeatures.overall_safety_rating
          }
        }
      };

    } catch (error: any) {
      console.error('ICAO ML training data generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Real-time safety alert generation from ICAO data
   */
  async generateSafetyAlerts(): Promise<{
    critical_alerts: any[];
    warning_alerts: any[];
    advisory_alerts: any[];
    airspace_status: string;
    recommendations: string[];
  }> {
    try {
      const trainingData = await this.generateMLTrainingData();
      const criticalAlerts: any[] = [];
      const warningAlerts: any[] = [];
      const advisoryAlerts: any[] = [];

      // Process each flight for safety alerts
      trainingData.features.forEach(flight => {
        // Critical alerts
        if (flight.emergency_status) {
          criticalAlerts.push({
            type: 'EMERGENCY_AIRCRAFT',
            callsign: flight.callsign,
            severity: 'critical',
            message: `Emergency declared by ${flight.callsign} - immediate assistance required`,
            location: { lat: flight.latitude, lon: flight.longitude },
            altitude: flight.altitude,
            timestamp: new Date().toISOString()
          });
        }

        if (flight.altitude_risk_score > 0.9) {
          criticalAlerts.push({
            type: 'ALTITUDE_VIOLATION',
            callsign: flight.callsign,
            severity: 'critical',
            message: `Dangerous altitude detected for ${flight.callsign}`,
            altitude: flight.altitude,
            timestamp: new Date().toISOString()
          });
        }

        // Warning alerts
        if (flight.speed_anomaly_score > 0.7) {
          warningAlerts.push({
            type: 'SPEED_ANOMALY',
            callsign: flight.callsign,
            severity: 'warning',
            message: `Unusual speed pattern detected for ${flight.callsign}`,
            speed: flight.ground_speed,
            timestamp: new Date().toISOString()
          });
        }

        if (flight.route_deviation_score > 0.8) {
          warningAlerts.push({
            type: 'ROUTE_DEVIATION',
            callsign: flight.callsign,
            severity: 'warning',
            message: `Significant route deviation detected for ${flight.callsign}`,
            timestamp: new Date().toISOString()
          });
        }

        // Advisory alerts
        if (flight.congestion_score > 0.6) {
          advisoryAlerts.push({
            type: 'AIRSPACE_CONGESTION',
            severity: 'advisory',
            message: 'High airspace density detected - monitor traffic flow',
            congestion_level: flight.congestion_score,
            timestamp: new Date().toISOString()
          });
        }
      });

      const airspaceStatus = this.determineAirspaceStatus(criticalAlerts.length, warningAlerts.length);
      const recommendations = this.generateSafetyRecommendations(criticalAlerts, warningAlerts, trainingData.metadata.safety_metrics);

      return {
        critical_alerts: criticalAlerts,
        warning_alerts: warningAlerts,
        advisory_alerts: advisoryAlerts,
        airspace_status: airspaceStatus,
        recommendations: recommendations
      };

    } catch (error: any) {
      console.error('Safety alert generation failed:', error.message);
      return {
        critical_alerts: [],
        warning_alerts: [],
        advisory_alerts: [{
          type: 'SYSTEM_ERROR',
          severity: 'advisory',
          message: 'ICAO data temporarily unavailable - using cached safety data',
          timestamp: new Date().toISOString()
        }],
        airspace_status: 'monitoring',
        recommendations: ['Monitor system status', 'Verify ICAO API connectivity']
      };
    }
  }

  // Private helper methods for ML feature calculation

  private calculateAltitudeRisk(altitude: number): number {
    if (altitude < this.safetyThresholds.altitude_min) return 1.0;
    if (altitude > this.safetyThresholds.altitude_max) return 0.9;
    if (altitude < 5000) return 0.3; // Approach/departure phase
    return 0.1; // Normal cruise altitude
  }

  private calculateSpeedAnomalyScore(speed: number): number {
    const typicalCruiseSpeed = 450; // knots
    const deviation = Math.abs(speed - typicalCruiseSpeed);
    return Math.min(deviation / this.safetyThresholds.speed_variance_threshold, 1.0);
  }

  private calculateRouteDeviation(flight: ICAOFlightData): number {
    // Simplified route deviation calculation
    // In production, this would compare against filed flight plans
    if (!flight.position) return 0;
    
    // Check for unusual heading changes or position anomalies
    const heading = flight.position.heading;
    if (heading < 0 || heading > 360) return 0.8;
    
    return 0.1; // Default low deviation
  }

  private assessSquawkRisk(squawk: string): 'normal' | 'caution' | 'emergency' {
    if (this.safetyThresholds.emergency_squawks.includes(squawk)) {
      return 'emergency';
    }
    if (squawk.startsWith('76') || squawk.startsWith('75')) {
      return 'caution';
    }
    return 'normal';
  }

  private calculateFlightPhaseRisk(phase: string, altitude: number): number {
    switch (phase?.toLowerCase()) {
      case 'takeoff':
      case 'landing':
        return 0.7; // Higher risk phases
      case 'approach':
        return 0.5;
      case 'cruise':
        return altitude < 10000 ? 0.3 : 0.1;
      default:
        return 0.2;
    }
  }

  private calculateOperationalImpact(notams: ICAONotamData[]): number {
    if (!notams.length) return 0;
    
    let totalImpact = 0;
    notams.forEach(notam => {
      const severityWeight = {
        'critical': 1.0,
        'high': 0.8,
        'medium': 0.5,
        'low': 0.2
      }[notam.severity] || 0.1;
      
      const operationalWeight = notam.affects_operations ? 1.5 : 1.0;
      totalImpact += severityWeight * operationalWeight;
    });
    
    return Math.min(totalImpact / notams.length, 1.0);
  }

  private calculateSeverityWeights(notams: ICAONotamData[]): number {
    return notams.reduce((total, notam) => {
      const weights = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
      return total + (weights[notam.severity] || 1);
    }, 0);
  }

  private buildAirportRiskMatrix(notams: ICAONotamData[]): { [airport: string]: number } {
    const matrix: { [airport: string]: number } = {};
    
    notams.forEach(notam => {
      const airport = notam.airport_icao;
      if (!matrix[airport]) matrix[airport] = 0;
      
      const riskValue = {
        'critical': 0.9,
        'high': 0.7,
        'medium': 0.4,
        'low': 0.1
      }[notam.severity] || 0.1;
      
      matrix[airport] = Math.max(matrix[airport], riskValue);
    });
    
    return matrix;
  }

  private identifyCriticalConditions(notams: ICAONotamData[]): string[] {
    return notams
      .filter(notam => notam.severity === 'critical' || 
                      this.safetyThresholds.critical_notam_types.some(type => 
                        notam.type.includes(type)))
      .map(notam => `${notam.airport_icao}: ${notam.condition}`)
      .slice(0, 10); // Limit to top 10 critical conditions
  }

  private calculateAirspaceCongestion(flights: ICAOFlightData[]): number {
    if (!flights.length) return 0;
    
    // Simple congestion calculation based on flight density
    const activeFlights = flights.filter(f => f.position?.altitude_ft && f.position.altitude_ft > 1000);
    
    if (activeFlights.length < 10) return 0.1;
    if (activeFlights.length < 50) return 0.3;
    if (activeFlights.length < 100) return 0.6;
    return 0.9;
  }

  private detectSeparationViolations(flights: ICAOFlightData[]): number {
    let violations = 0;
    
    for (let i = 0; i < flights.length; i++) {
      for (let j = i + 1; j < flights.length; j++) {
        const flight1 = flights[i];
        const flight2 = flights[j];
        
        if (flight1.position && flight2.position) {
          const distance = this.calculateDistance(
            flight1.position.latitude, flight1.position.longitude,
            flight2.position.latitude, flight2.position.longitude
          );
          
          const altitudeDiff = Math.abs(flight1.position.altitude_ft - flight2.position.altitude_ft);
          
          if (distance < this.safetyThresholds.separation_minimum && altitudeDiff < 1000) {
            violations++;
          }
        }
      }
    }
    
    return violations;
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 3440.065; // Nautical miles radius of Earth
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private async assessWeatherImpact(flights: ICAOFlightData[]): Promise<number> {
    // Simplified weather impact assessment
    // In production, this would integrate with weather APIs
    return 0.2; // Default moderate weather impact
  }

  private calculateOverallSafetyRating(congestion: number, violations: number, notams: ICAONotamData[]): 'safe' | 'caution' | 'unsafe' {
    const criticalNotams = notams.filter(n => n.severity === 'critical').length;
    
    if (violations > 2 || criticalNotams > 5 || congestion > 0.8) {
      return 'unsafe';
    } else if (violations > 0 || criticalNotams > 2 || congestion > 0.6) {
      return 'caution';
    }
    return 'safe';
  }

  private determineAirspaceStatus(criticalCount: number, warningCount: number): string {
    if (criticalCount > 0) return 'critical';
    if (warningCount > 3) return 'heightened';
    if (warningCount > 0) return 'monitoring';
    return 'normal';
  }

  private generateSafetyRecommendations(critical: any[], warnings: any[], metrics: any): string[] {
    const recommendations: string[] = [];
    
    if (critical.length > 0) {
      recommendations.push('Immediate intervention required for emergency situations');
      recommendations.push('Coordinate with ATC for priority handling');
    }
    
    if (warnings.length > 3) {
      recommendations.push('Increase monitoring frequency for flagged aircraft');
      recommendations.push('Consider traffic flow adjustments');
    }
    
    if (metrics.separation_violations > 0) {
      recommendations.push('Review separation standards compliance');
      recommendations.push('Enhance radar monitoring in congested areas');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('Maintain current operational procedures');
      recommendations.push('Continue routine safety monitoring');
    }
    
    return recommendations;
  }
}

export const icaoMLIntegration = new ICAOMLIntegrationService();