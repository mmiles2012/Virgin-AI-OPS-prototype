/**
 * UK CAA Punctuality Statistics Processor for AINO Aviation Intelligence Platform
 * Processes authentic UK CAA data to enhance ML delay prediction models
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { scoreDecision, evaluateConstraints, DecisionFactors } from './utils/decisionMath';

// ES module equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export interface UKCAARecord {
  run_date: string;
  reporting_period: string;
  reporting_airport: string;
  origin_destination_country: string;
  origin_destination: string;
  airline_name: string;
  arrival_departure: 'A' | 'D';
  scheduled_charter: 'S' | 'C';
  number_flights_matched: number;
  number_flights_cancelled: number;
  on_time_percent_ot15: number;
  average_delay_all_flights_minutes: number;
  flights_more_than_15_minutes_early_percent: number;
  flights_15_minutes_early_to_1_minute_early_percent: number;
  flights_0_to_15_minutes_late_percent: number;
  flights_between_16_and_30_minutes_late_percent: number;
  flights_between_31_and_60_minutes_late_percent: number;
  flights_between_61_and_120_minutes_late_percent: number;
}

export interface PunctualityAnalysis {
  airport: string;
  airline: string;
  route: string;
  direction: 'arrival' | 'departure';
  on_time_performance: number;
  average_delay: number;
  delay_distribution: {
    early: number;
    on_time: number;
    moderate_delay: number;
    significant_delay: number;
    severe_delay: number;
  };
  risk_level: 'low' | 'medium' | 'high' | 'critical';
  ml_prediction_factors: DecisionFactors;
}

export class UKCaaPunctualityProcessor {
  private data: UKCAARecord[] = [];
  private processedAnalysis: Map<string, PunctualityAnalysis> = new Map();

  constructor() {
    this.loadData();
  }

  private loadData(): void {
    try {
      const csvPath = path.join(__dirname, '../data/uk_caa_202501_punctuality.csv');
      if (fs.existsSync(csvPath)) {
        const csvContent = fs.readFileSync(csvPath, 'utf-8');
        this.data = this.parseCsvData(csvContent);
        this.processAnalysis();
      }
    } catch (error) {
      console.error('Error loading UK CAA punctuality data:', error);
    }
  }

  private parseCsvData(csvContent: string): UKCAARecord[] {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',');
    
    return lines.slice(1).map(line => {
      const values = line.split(',');
      return {
        run_date: values[0],
        reporting_period: values[1],
        reporting_airport: values[2],
        origin_destination_country: values[3],
        origin_destination: values[4],
        airline_name: values[5],
        arrival_departure: values[6] as 'A' | 'D',
        scheduled_charter: values[7] as 'S' | 'C',
        number_flights_matched: parseFloat(values[8]) || 0,
        number_flights_cancelled: parseFloat(values[10]) || 0,
        on_time_percent_ot15: parseFloat(values[23]) || 0,
        average_delay_all_flights_minutes: parseFloat(values[25]) || 0,
        flights_more_than_15_minutes_early_percent: parseFloat(values[11]) || 0,
        flights_15_minutes_early_to_1_minute_early_percent: parseFloat(values[12]) || 0,
        flights_0_to_15_minutes_late_percent: parseFloat(values[13]) || 0,
        flights_between_16_and_30_minutes_late_percent: parseFloat(values[14]) || 0,
        flights_between_31_and_60_minutes_late_percent: parseFloat(values[15]) || 0,
        flights_between_61_and_120_minutes_late_percent: parseFloat(values[16]) || 0,
      };
    });
  }

  private processAnalysis(): void {
    this.data.forEach(record => {
      const key = `${record.reporting_airport}-${record.origin_destination}-${record.airline_name}-${record.arrival_departure}`;
      
      const analysis: PunctualityAnalysis = {
        airport: record.reporting_airport,
        airline: record.airline_name,
        route: `${record.reporting_airport}-${record.origin_destination}`,
        direction: record.arrival_departure === 'A' ? 'arrival' : 'departure',
        on_time_performance: record.on_time_percent_ot15,
        average_delay: record.average_delay_all_flights_minutes,
        delay_distribution: {
          early: record.flights_more_than_15_minutes_early_percent + 
                 record.flights_15_minutes_early_to_1_minute_early_percent,
          on_time: record.flights_0_to_15_minutes_late_percent,
          moderate_delay: record.flights_between_16_and_30_minutes_late_percent,
          significant_delay: record.flights_between_31_and_60_minutes_late_percent,
          severe_delay: record.flights_between_61_and_120_minutes_late_percent
        },
        risk_level: this.calculateRiskLevel(record),
        ml_prediction_factors: this.createMLFactors(record)
      };

      this.processedAnalysis.set(key, analysis);
    });
  }

  private calculateRiskLevel(record: UKCAARecord): 'low' | 'medium' | 'high' | 'critical' {
    const avgDelay = record.average_delay_all_flights_minutes;
    const onTimePerf = record.on_time_percent_ot15;
    const severeDelayRate = record.flights_between_61_and_120_minutes_late_percent;

    if (avgDelay > 30 || onTimePerf < 50 || severeDelayRate > 10) {
      return 'critical';
    } else if (avgDelay > 20 || onTimePerf < 70 || severeDelayRate > 5) {
      return 'high';
    } else if (avgDelay > 10 || onTimePerf < 85) {
      return 'medium';
    }
    return 'low';
  }

  private createMLFactors(record: UKCAARecord): DecisionFactors {
    // Convert UK CAA data to ML prediction factors
    const safetyScore = Math.max(20, 100 - (record.average_delay_all_flights_minutes * 2));
    const costImpact = record.average_delay_all_flights_minutes * 800; // £800 per minute delay cost
    const timeImpact = record.average_delay_all_flights_minutes;
    const feasibility = record.on_time_percent_ot15;

    return {
      safetyScore,
      costImpact,
      timeImpact,
      feasibility,
      riskLevel: this.calculateRiskLevel(record)
    };
  }

  /**
   * Get punctuality analysis for specific route
   */
  public getRouteAnalysis(airport: string, destination: string, airline: string, direction: 'A' | 'D'): PunctualityAnalysis | null {
    const key = `${airport}-${destination}-${airline}-${direction}`;
    return this.processedAnalysis.get(key) || null;
  }

  /**
   * Get ML prediction enhanced with UK CAA historical data
   */
  public getEnhancedPrediction(
    airport: string,
    destination: string,
    airline: string,
    direction: 'A' | 'D',
    currentConditions?: any
  ): {
    predicted_delay: number;
    confidence: number;
    top_contributors: string[];
    historical_performance: PunctualityAnalysis | null;
    decision_score: number;
  } {
    const historical = this.getRouteAnalysis(airport, destination, airline, direction);
    
    let predicted_delay = historical?.average_delay || 15;
    let confidence = historical ? (historical.on_time_performance / 100) : 0.75;
    
    // Adjust prediction based on current conditions
    if (currentConditions) {
      if (currentConditions.weather_impact) predicted_delay += 10;
      if (currentConditions.traffic_congestion) predicted_delay += 5;
      if (currentConditions.aircraft_maintenance) predicted_delay += 15;
    }

    const contributors = this.identifyContributors(historical, currentConditions);
    
    // Calculate decision score using enhanced ML factors
    const decisionFactors = historical?.ml_prediction_factors || {
      safetyScore: 80,
      costImpact: predicted_delay * 800,
      timeImpact: predicted_delay,
      feasibility: confidence * 100,
      riskLevel: 'medium' as const
    };

    const decisionWeights = {
      safety: 0.35,
      cost: 0.25,
      time: 0.25,
      feasibility: 0.15
    };

    const decision_score = scoreDecision(decisionFactors, decisionWeights);

    return {
      predicted_delay: Math.round(predicted_delay),
      confidence: Math.round(confidence * 100) / 100,
      top_contributors: contributors,
      historical_performance: historical,
      decision_score: Math.round(decision_score * 100) / 100
    };
  }

  private identifyContributors(historical: PunctualityAnalysis | null, currentConditions?: any): string[] {
    const contributors: string[] = [];

    if (historical) {
      if (historical.delay_distribution.severe_delay > 5) {
        contributors.push('historical_severe_delays');
      }
      if (historical.on_time_performance < 70) {
        contributors.push('poor_historical_performance');
      }
      if (historical.average_delay > 20) {
        contributors.push('chronic_delays');
      }
    }

    if (currentConditions) {
      if (currentConditions.weather_impact) contributors.push('weather_ct');
      if (currentConditions.traffic_congestion) contributors.push('traffic_ct');
      if (currentConditions.aircraft_maintenance) contributors.push('maintenance_ct');
      if (currentConditions.late_aircraft) contributors.push('late_aircraft_ct');
    }

    // Default contributors if none identified
    if (contributors.length === 0) {
      contributors.push('operational_factors', 'schedule_density');
    }

    return contributors.slice(0, 3); // Return top 3 contributors
  }

  /**
   * Get airport performance summary
   */
  public getAirportSummary(airport: string): {
    total_routes: number;
    average_on_time_performance: number;
    average_delay: number;
    risk_distribution: Record<string, number>;
    top_performing_airlines: Array<{airline: string, performance: number}>;
  } {
    const airportData = Array.from(this.processedAnalysis.values())
      .filter(analysis => analysis.airport === airport);

    if (airportData.length === 0) {
      return {
        total_routes: 0,
        average_on_time_performance: 0,
        average_delay: 0,
        risk_distribution: {},
        top_performing_airlines: []
      };
    }

    const avgOnTime = airportData.reduce((sum, a) => sum + a.on_time_performance, 0) / airportData.length;
    const avgDelay = airportData.reduce((sum, a) => sum + a.average_delay, 0) / airportData.length;

    const riskDist = airportData.reduce((acc, a) => {
      acc[a.risk_level] = (acc[a.risk_level] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const airlinePerf = airportData.reduce((acc, a) => {
      if (!acc[a.airline]) acc[a.airline] = [];
      acc[a.airline].push(a.on_time_performance);
      return acc;
    }, {} as Record<string, number[]>);

    const topAirlines = Object.entries(airlinePerf)
      .map(([airline, perfs]) => ({
        airline,
        performance: perfs.reduce((sum, p) => sum + p, 0) / perfs.length
      }))
      .sort((a, b) => b.performance - a.performance)
      .slice(0, 5);

    return {
      total_routes: airportData.length,
      average_on_time_performance: Math.round(avgOnTime * 100) / 100,
      average_delay: Math.round(avgDelay * 100) / 100,
      risk_distribution: riskDist,
      top_performing_airlines: topAirlines
    };
  }

  /**
   * Get all available data for ML training
   */
  public getAllAnalysis(): PunctualityAnalysis[] {
    return Array.from(this.processedAnalysis.values());
  }
}

// Singleton instance
export const ukCaaProcessor = new UKCaaPunctualityProcessor();