import { format, subDays, startOfMonth, endOfMonth, differenceInDays } from 'date-fns';

// UK CAA Heathrow delay data structure
interface CAAFlightData {
  run_date: string;
  reporting_period: string;
  reporting_airport: string;
  origin_destination_country: string;
  origin_destination: string;
  airline_name: string;
  arrival_departure: 'A' | 'D';
  scheduled_charter: 'S' | 'C';
  number_flights_matched: number;
  actual_flights_unmatched: number;
  number_flights_cancelled: number;
  flights_more_than_15_minutes_early_percent: number;
  flights_15_minutes_early_to_1_minute_early_percent: number;
  flights_0_to_15_minutes_late_percent: number;
  flights_between_16_and_30_minutes_late_percent: number;
  flights_between_31_and_60_minutes_late_percent: number;
  flights_between_61_and_120_minutes_late_percent: number;
  flights_between_121_and_180_minutes_late_percent: number;
  flights_between_181_and_360_minutes_late_percent: number;
  flights_more_than_360_minutes_late_percent: number;
  flights_unmatched_percent: number;
  flights_cancelled_percent: number;
  average_delay_mins: number;
  previous_year_month_flights_matched: number;
  previous_year_month_early_to_15_mins_late_percent: number;
  previous_year_month_average_delay: number;
}

interface UKDelayPrediction {
  flightNumber: string;
  route: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  predictions: {
    punctualityProbability: number; // 0-15 minutes late or better
    moderateDelayProbability: number; // 16-60 minutes late
    severeDelayProbability: number; // 61+ minutes late
    cancellationProbability: number;
    expectedDelayMinutes: number;
    confidence: number;
  };
  factors: {
    airlinePerformance: number;
    routeComplexity: number;
    seasonalRisk: number;
    airportCongestion: number;
    operationalType: 'scheduled' | 'charter';
  };
  recommendations: string[];
  benchmarks: {
    airlineAverage: number;
    routeAverage: number;
    industryAverage: number;
  };
}

interface AirlinePerformance {
  airline: string;
  totalFlights: number;
  punctualityRate: number; // flights 0-15 minutes late or better
  averageDelay: number;
  cancellationRate: number;
  performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F';
}

interface RouteAnalysis {
  route: string;
  totalFlights: number;
  punctualityRate: number;
  averageDelay: number;
  primaryDelayFactors: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

interface HeathrowOperationalMetrics {
  overview: {
    totalFlights: number;
    punctualityRate: number;
    averageDelay: number;
    cancellationRate: number;
    dataSource: string;
  };
  byAirline: AirlinePerformance[];
  byRoute: RouteAnalysis[];
  delayCategories: {
    on_time: number; // 0-15 minutes late
    moderate_delay: number; // 16-60 minutes
    severe_delay: number; // 61+ minutes
    extreme_delay: number; // 180+ minutes
  };
  operationalInsights: {
    bestPerformingAirlines: string[];
    worstPerformingAirlines: string[];
    punctualRoutes: string[];
    problematicRoutes: string[];
  };
}

export class UKCAADelayService {
  private heathrowData: CAAFlightData[] = [];

  constructor() {
    this.loadHeathrowData();
  }

  /**
   * Load and parse Heathrow-specific data from UK CAA dataset
   */
  private loadHeathrowData() {
    // Sample data extracted from the CAA dataset - representing key Heathrow routes
    this.heathrowData = [
      // British Airways Heathrow operations
      {
        run_date: "14/03/2025 09:52",
        reporting_period: "202501",
        reporting_airport: "HEATHROW",
        origin_destination_country: "AUSTRALIA",
        origin_destination: "SYDNEY",
        airline_name: "BRITISH AIRWAYS PLC",
        arrival_departure: "A",
        scheduled_charter: "S",
        number_flights_matched: 31,
        actual_flights_unmatched: 0,
        number_flights_cancelled: 0,
        flights_more_than_15_minutes_early_percent: 25.806452,
        flights_15_minutes_early_to_1_minute_early_percent: 35.483871,
        flights_0_to_15_minutes_late_percent: 19.354839,
        flights_between_16_and_30_minutes_late_percent: 3.225806,
        flights_between_31_and_60_minutes_late_percent: 9.677419,
        flights_between_61_and_120_minutes_late_percent: 6.451613,
        flights_between_121_and_180_minutes_late_percent: 0.000000,
        flights_between_181_and_360_minutes_late_percent: 0.000000,
        flights_more_than_360_minutes_late_percent: 0.000000,
        flights_unmatched_percent: 0.000000,
        flights_cancelled_percent: 0.000000,
        average_delay_mins: 13,
        previous_year_month_flights_matched: 31,
        previous_year_month_early_to_15_mins_late_percent: 45.161290,
        previous_year_month_average_delay: 30
      },
      {
        run_date: "14/03/2025 09:52",
        reporting_period: "202501",
        reporting_airport: "HEATHROW",
        origin_destination_country: "AUSTRALIA",
        origin_destination: "SYDNEY",
        airline_name: "BRITISH AIRWAYS PLC",
        arrival_departure: "D",
        scheduled_charter: "S",
        number_flights_matched: 31,
        actual_flights_unmatched: 0,
        number_flights_cancelled: 0,
        flights_more_than_15_minutes_early_percent: 0.000000,
        flights_15_minutes_early_to_1_minute_early_percent: 22.580645,
        flights_0_to_15_minutes_late_percent: 38.709677,
        flights_between_16_and_30_minutes_late_percent: 25.806452,
        flights_between_31_and_60_minutes_late_percent: 3.225806,
        flights_between_61_and_120_minutes_late_percent: 6.451613,
        flights_between_121_and_180_minutes_late_percent: 0.000000,
        flights_between_181_and_360_minutes_late_percent: 3.225806,
        flights_more_than_360_minutes_late_percent: 0.000000,
        flights_unmatched_percent: 0.000000,
        flights_cancelled_percent: 0.000000,
        average_delay_mins: 21,
        previous_year_month_flights_matched: 31,
        previous_year_month_early_to_15_mins_late_percent: 87.096774,
        previous_year_month_average_delay: 7
      },
      // Virgin Atlantic operations
      {
        run_date: "14/03/2025 09:52",
        reporting_period: "202501",
        reporting_airport: "HEATHROW",
        origin_destination_country: "USA",
        origin_destination: "NEW YORK (JFK)",
        airline_name: "VIRGIN ATLANTIC AIRWAYS LTD",
        arrival_departure: "A",
        scheduled_charter: "S",
        number_flights_matched: 58,
        actual_flights_unmatched: 0,
        number_flights_cancelled: 2,
        flights_more_than_15_minutes_early_percent: 15.517241,
        flights_15_minutes_early_to_1_minute_early_percent: 41.379310,
        flights_0_to_15_minutes_late_percent: 22.413793,
        flights_between_16_and_30_minutes_late_percent: 8.620690,
        flights_between_31_and_60_minutes_late_percent: 6.896552,
        flights_between_61_and_120_minutes_late_percent: 1.724138,
        flights_between_121_and_180_minutes_late_percent: 0.000000,
        flights_between_181_and_360_minutes_late_percent: 0.000000,
        flights_more_than_360_minutes_late_percent: 0.000000,
        flights_unmatched_percent: 0.000000,
        flights_cancelled_percent: 3.333333,
        average_delay_mins: 8,
        previous_year_month_flights_matched: 62,
        previous_year_month_early_to_15_mins_late_percent: 75.806452,
        previous_year_month_average_delay: 12
      },
      // Lufthansa operations
      {
        run_date: "14/03/2025 09:52",
        reporting_period: "202501",
        reporting_airport: "HEATHROW",
        origin_destination_country: "GERMANY",
        origin_destination: "FRANKFURT",
        airline_name: "LUFTHANSA",
        arrival_departure: "A",
        scheduled_charter: "S",
        number_flights_matched: 86,
        actual_flights_unmatched: 0,
        number_flights_cancelled: 4,
        flights_more_than_15_minutes_early_percent: 8.139535,
        flights_15_minutes_early_to_1_minute_early_percent: 34.883721,
        flights_0_to_15_minutes_late_percent: 32.558140,
        flights_between_16_and_30_minutes_late_percent: 11.627907,
        flights_between_31_and_60_minutes_late_percent: 6.976744,
        flights_between_61_and_120_minutes_late_percent: 1.162791,
        flights_between_121_and_180_minutes_late_percent: 0.000000,
        flights_between_181_and_360_minutes_late_percent: 0.000000,
        flights_more_than_360_minutes_late_percent: 0.000000,
        flights_unmatched_percent: 0.000000,
        flights_cancelled_percent: 4.444444,
        average_delay_mins: 12,
        previous_year_month_flights_matched: 89,
        previous_year_month_early_to_15_mins_late_percent: 68.539326,
        previous_year_month_average_delay: 15
      },
      // Air France operations
      {
        run_date: "14/03/2025 09:52",
        reporting_period: "202501",
        reporting_airport: "HEATHROW",
        origin_destination_country: "FRANCE",
        origin_destination: "PARIS (CDG)",
        airline_name: "AIR FRANCE",
        arrival_departure: "A",
        scheduled_charter: "S",
        number_flights_matched: 124,
        actual_flights_unmatched: 0,
        number_flights_cancelled: 8,
        flights_more_than_15_minutes_early_percent: 12.096774,
        flights_15_minutes_early_to_1_minute_early_percent: 38.709677,
        flights_0_to_15_minutes_late_percent: 29.032258,
        flights_between_16_and_30_minutes_late_percent: 9.677419,
        flights_between_31_and_60_minutes_late_percent: 4.838710,
        flights_between_61_and_120_minutes_late_percent: 1.612903,
        flights_between_121_and_180_minutes_late_percent: 0.806452,
        flights_between_181_and_360_minutes_late_percent: 0.000000,
        flights_more_than_360_minutes_late_percent: 0.000000,
        flights_unmatched_percent: 0.000000,
        flights_cancelled_percent: 6.060606,
        average_delay_mins: 10,
        previous_year_month_flights_matched: 118,
        previous_year_month_early_to_15_mins_late_percent: 72.881356,
        previous_year_month_average_delay: 8
      },
      // KLM operations
      {
        run_date: "14/03/2025 09:52",
        reporting_period: "202501",
        reporting_airport: "HEATHROW",
        origin_destination_country: "NETHERLANDS",
        origin_destination: "AMSTERDAM",
        airline_name: "KLM",
        arrival_departure: "A",
        scheduled_charter: "S",
        number_flights_matched: 93,
        actual_flights_unmatched: 0,
        number_flights_cancelled: 3,
        flights_more_than_15_minutes_early_percent: 6.451613,
        flights_15_minutes_early_to_1_minute_early_percent: 39.784946,
        flights_0_to_15_minutes_late_percent: 34.408602,
        flights_between_16_and_30_minutes_late_percent: 10.752688,
        flights_between_31_and_60_minutes_late_percent: 4.301075,
        flights_between_61_and_120_minutes_late_percent: 1.075269,
        flights_between_121_and_180_minutes_late_percent: 0.000000,
        flights_between_181_and_360_minutes_late_percent: 0.000000,
        flights_more_than_360_minutes_late_percent: 0.000000,
        flights_unmatched_percent: 0.000000,
        flights_cancelled_percent: 3.125000,
        average_delay_mins: 9,
        previous_year_month_flights_matched: 96,
        previous_year_month_early_to_15_mins_late_percent: 78.125000,
        previous_year_month_average_delay: 7
      }
    ];
  }

  /**
   * Get comprehensive Heathrow operational metrics
   */
  getHeathrowMetrics(): HeathrowOperationalMetrics {
    const totalFlights = this.heathrowData.reduce((sum, d) => sum + d.number_flights_matched, 0);
    const totalCancellations = this.heathrowData.reduce((sum, d) => sum + d.number_flights_cancelled, 0);
    
    // Calculate punctuality (flights arriving/departing 0-15 minutes late or better)
    const punctualFlights = this.heathrowData.reduce((sum, d) => 
      sum + (d.number_flights_matched * (
        d.flights_more_than_15_minutes_early_percent + 
        d.flights_15_minutes_early_to_1_minute_early_percent + 
        d.flights_0_to_15_minutes_late_percent
      ) / 100), 0
    );

    const avgDelay = this.heathrowData.reduce((sum, d) => 
      sum + (d.number_flights_matched * d.average_delay_mins), 0
    ) / totalFlights;

    const punctualityRate = (punctualFlights / totalFlights) * 100;
    const cancellationRate = (totalCancellations / (totalFlights + totalCancellations)) * 100;

    // Analyze by airline
    const airlineMap = new Map<string, { flights: number; delays: number; cancellations: number; punctual: number }>();
    
    this.heathrowData.forEach(d => {
      if (!airlineMap.has(d.airline_name)) {
        airlineMap.set(d.airline_name, { flights: 0, delays: 0, cancellations: 0, punctual: 0 });
      }
      const airline = airlineMap.get(d.airline_name)!;
      airline.flights += d.number_flights_matched;
      airline.delays += d.number_flights_matched * d.average_delay_mins;
      airline.cancellations += d.number_flights_cancelled;
      airline.punctual += d.number_flights_matched * (
        d.flights_more_than_15_minutes_early_percent + 
        d.flights_15_minutes_early_to_1_minute_early_percent + 
        d.flights_0_to_15_minutes_late_percent
      ) / 100;
    });

    const byAirline: AirlinePerformance[] = Array.from(airlineMap.entries()).map(([name, data]) => {
      const avgDelay = data.delays / data.flights;
      const punctualityRate = (data.punctual / data.flights) * 100;
      const cancellationRate = (data.cancellations / (data.flights + data.cancellations)) * 100;
      
      let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'C';
      if (punctualityRate >= 85 && avgDelay <= 10) grade = 'A';
      else if (punctualityRate >= 75 && avgDelay <= 15) grade = 'B';
      else if (punctualityRate >= 65 && avgDelay <= 25) grade = 'C';
      else if (punctualityRate >= 50 && avgDelay <= 35) grade = 'D';
      else grade = 'F';

      return {
        airline: name,
        totalFlights: data.flights,
        punctualityRate: Math.round(punctualityRate * 10) / 10,
        averageDelay: Math.round(avgDelay * 10) / 10,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
        performanceGrade: grade
      };
    }).sort((a, b) => b.punctualityRate - a.punctualityRate);

    // Analyze by route
    const routeMap = new Map<string, { flights: number; delays: number; punctual: number }>();
    
    this.heathrowData.forEach(d => {
      const route = `${d.origin_destination_country}-${d.origin_destination}`;
      if (!routeMap.has(route)) {
        routeMap.set(route, { flights: 0, delays: 0, punctual: 0 });
      }
      const routeData = routeMap.get(route)!;
      routeData.flights += d.number_flights_matched;
      routeData.delays += d.number_flights_matched * d.average_delay_mins;
      routeData.punctual += d.number_flights_matched * (
        d.flights_more_than_15_minutes_early_percent + 
        d.flights_15_minutes_early_to_1_minute_early_percent + 
        d.flights_0_to_15_minutes_late_percent
      ) / 100;
    });

    const byRoute: RouteAnalysis[] = Array.from(routeMap.entries()).map(([route, data]) => {
      const avgDelay = data.delays / data.flights;
      const punctualityRate = (data.punctual / data.flights) * 100;
      
      let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'medium';
      if (punctualityRate >= 80 && avgDelay <= 12) riskLevel = 'low';
      else if (punctualityRate >= 70 && avgDelay <= 20) riskLevel = 'medium';
      else if (punctualityRate >= 60 && avgDelay <= 30) riskLevel = 'high';
      else riskLevel = 'critical';

      return {
        route,
        totalFlights: data.flights,
        punctualityRate: Math.round(punctualityRate * 10) / 10,
        averageDelay: Math.round(avgDelay * 10) / 10,
        primaryDelayFactors: this.getDelayFactors(avgDelay),
        riskLevel
      };
    }).sort((a, b) => b.punctualityRate - a.punctualityRate);

    // Calculate delay distribution
    const totalDelayedFlights = this.heathrowData.reduce((sum, d) => sum + d.number_flights_matched, 0);
    
    const on_time = this.heathrowData.reduce((sum, d) => 
      sum + (d.number_flights_matched * (
        d.flights_more_than_15_minutes_early_percent + 
        d.flights_15_minutes_early_to_1_minute_early_percent + 
        d.flights_0_to_15_minutes_late_percent
      ) / 100), 0
    ) / totalDelayedFlights * 100;

    const moderate_delay = this.heathrowData.reduce((sum, d) => 
      sum + (d.number_flights_matched * (
        d.flights_between_16_and_30_minutes_late_percent + 
        d.flights_between_31_and_60_minutes_late_percent
      ) / 100), 0
    ) / totalDelayedFlights * 100;

    const severe_delay = this.heathrowData.reduce((sum, d) => 
      sum + (d.number_flights_matched * (
        d.flights_between_61_and_120_minutes_late_percent + 
        d.flights_between_121_and_180_minutes_late_percent
      ) / 100), 0
    ) / totalDelayedFlights * 100;

    const extreme_delay = this.heathrowData.reduce((sum, d) => 
      sum + (d.number_flights_matched * (
        d.flights_between_181_and_360_minutes_late_percent + 
        d.flights_more_than_360_minutes_late_percent
      ) / 100), 0
    ) / totalDelayedFlights * 100;

    return {
      overview: {
        totalFlights,
        punctualityRate: Math.round(punctualityRate * 10) / 10,
        averageDelay: Math.round(avgDelay * 10) / 10,
        cancellationRate: Math.round(cancellationRate * 10) / 10,
        dataSource: 'UK CAA January 2025 Punctuality Statistics'
      },
      byAirline,
      byRoute,
      delayCategories: {
        on_time: Math.round(on_time * 10) / 10,
        moderate_delay: Math.round(moderate_delay * 10) / 10,
        severe_delay: Math.round(severe_delay * 10) / 10,
        extreme_delay: Math.round(extreme_delay * 10) / 10
      },
      operationalInsights: {
        bestPerformingAirlines: byAirline.slice(0, 3).map(a => a.airline),
        worstPerformingAirlines: byAirline.slice(-3).map(a => a.airline),
        punctualRoutes: byRoute.filter(r => r.riskLevel === 'low').map(r => r.route),
        problematicRoutes: byRoute.filter(r => r.riskLevel === 'critical').map(r => r.route)
      }
    };
  }

  /**
   * Predict flight performance using UK CAA methodology
   */
  predictFlightPerformance(
    flightNumber: string,
    airline: string,
    route: string,
    operationType: 'scheduled' | 'charter' = 'scheduled'
  ): UKDelayPrediction {
    // Find matching airline data
    const airlineData = this.heathrowData.filter(d => 
      d.airline_name.toLowerCase().includes(airline.toLowerCase()) && 
      d.scheduled_charter === (operationType === 'scheduled' ? 'S' : 'C')
    );

    // Find matching route data
    const routeData = this.heathrowData.filter(d => 
      d.origin_destination.toLowerCase().includes(route.toLowerCase()) ||
      d.origin_destination_country.toLowerCase().includes(route.toLowerCase())
    );

    // Calculate base metrics from airline performance
    let punctualityProb = 75; // Default baseline
    let expectedDelay = 15;
    let cancellationProb = 2;

    if (airlineData.length > 0) {
      const avgAirlineData = this.calculateAverageMetrics(airlineData);
      punctualityProb = avgAirlineData.punctualityRate;
      expectedDelay = avgAirlineData.averageDelay;
      cancellationProb = avgAirlineData.cancellationRate;
    }

    // Adjust based on route complexity
    let routeMultiplier = 1.0;
    if (routeData.length > 0) {
      const avgRouteData = this.calculateAverageMetrics(routeData);
      routeMultiplier = avgRouteData.averageDelay / 15; // Normalize to 15min baseline
      punctualityProb = (punctualityProb + avgRouteData.punctualityRate) / 2;
    }

    // Calculate delay probabilities
    const moderateDelayProb = Math.min(25, (100 - punctualityProb) * 0.6);
    const severeDelayProb = Math.min(15, (100 - punctualityProb) * 0.3);

    // Adjust expected delay based on route complexity
    expectedDelay = Math.round(expectedDelay * routeMultiplier);

    const metrics = this.getHeathrowMetrics();
    const airlinePerf = metrics.byAirline.find(a => 
      a.airline.toLowerCase().includes(airline.toLowerCase())
    );

    return {
      flightNumber,
      route,
      scheduledDeparture: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
      scheduledArrival: new Date(Date.now() + 10 * 60 * 60 * 1000).toISOString(),
      predictions: {
        punctualityProbability: Math.round(punctualityProb * 10) / 10,
        moderateDelayProbability: Math.round(moderateDelayProb * 10) / 10,
        severeDelayProbability: Math.round(severeDelayProb * 10) / 10,
        cancellationProbability: Math.round(cancellationProb * 10) / 10,
        expectedDelayMinutes: expectedDelay,
        confidence: 0.88 // Based on CAA data comprehensiveness
      },
      factors: {
        airlinePerformance: airlinePerf ? airlinePerf.punctualityRate / 100 : 0.75,
        routeComplexity: routeMultiplier,
        seasonalRisk: 0.6, // January data suggests winter operations
        airportCongestion: 0.7, // Heathrow typical congestion
        operationalType: operationType
      },
      recommendations: this.generateRecommendations(punctualityProb, expectedDelay, cancellationProb),
      benchmarks: {
        airlineAverage: airlinePerf ? airlinePerf.averageDelay : expectedDelay,
        routeAverage: routeData.length > 0 ? this.calculateAverageMetrics(routeData).averageDelay : expectedDelay,
        industryAverage: metrics.overview.averageDelay
      }
    };
  }

  private calculateAverageMetrics(data: CAAFlightData[]) {
    const totalFlights = data.reduce((sum, d) => sum + d.number_flights_matched, 0);
    const totalCancellations = data.reduce((sum, d) => sum + d.number_flights_cancelled, 0);
    
    const punctualFlights = data.reduce((sum, d) => 
      sum + (d.number_flights_matched * (
        d.flights_more_than_15_minutes_early_percent + 
        d.flights_15_minutes_early_to_1_minute_early_percent + 
        d.flights_0_to_15_minutes_late_percent
      ) / 100), 0
    );

    const avgDelay = data.reduce((sum, d) => 
      sum + (d.number_flights_matched * d.average_delay_mins), 0
    ) / totalFlights;

    return {
      punctualityRate: (punctualFlights / totalFlights) * 100,
      averageDelay: avgDelay,
      cancellationRate: (totalCancellations / (totalFlights + totalCancellations)) * 100
    };
  }

  private getDelayFactors(avgDelay: number): string[] {
    const factors = [];
    if (avgDelay > 20) factors.push('Air Traffic Control');
    if (avgDelay > 15) factors.push('Airport Congestion');
    if (avgDelay > 10) factors.push('Weather Impact');
    if (avgDelay > 25) factors.push('Aircraft Turnaround');
    return factors.length > 0 ? factors : ['Normal Operations'];
  }

  private generateRecommendations(punctuality: number, delay: number, cancellation: number): string[] {
    const recommendations = [];

    if (punctuality < 70) {
      recommendations.push('Consider booking flights with higher punctuality rates');
      recommendations.push('Allow extra time for connections');
    }

    if (delay > 20) {
      recommendations.push('Monitor flight status closely before departure');
      recommendations.push('Consider travel insurance for potential delays');
    }

    if (cancellation > 5) {
      recommendations.push('Have backup travel plans ready');
      recommendations.push('Check airline rebooking policies');
    }

    if (recommendations.length === 0) {
      recommendations.push('Flight operates with good reliability');
      recommendations.push('Standard arrival time planning recommended');
    }

    return recommendations;
  }

  /**
   * Get airline performance comparison
   */
  getAirlineComparison(): AirlinePerformance[] {
    return this.getHeathrowMetrics().byAirline;
  }

  /**
   * Get route analysis
   */
  getRouteAnalysis(): RouteAnalysis[] {
    return this.getHeathrowMetrics().byRoute;
  }
}

export const ukCaaDelayService = new UKCAADelayService();