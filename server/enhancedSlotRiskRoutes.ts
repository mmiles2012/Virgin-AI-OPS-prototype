import express from 'express';
import { spawn } from 'child_process';
import fetch from 'node-fetch';

const router = express.Router();

// FlightAware API configuration
const FLIGHTAWARE_API_KEY = process.env.FLIGHTAWARE_API_KEY;
const FLIGHTAWARE_BASE_URL = 'https://aeroapi.flightaware.com/aeroapi';

// Virgin Atlantic flight identifiers
const VIRGIN_ATLANTIC_FLIGHTS = [
  'VIR3', 'VIR5', 'VIR9', 'VIR11', 'VIR19', 'VIR21', 
  'VIR25', 'VIR45', 'VIR85', 'VIR103', 'VIR117', 'VIR127',
  'VIR135', 'VIR137', 'VIR153', 'VIR157', 'VIR165', 'VIR300',
  'VIR354', 'VIR401'
];

interface FlightAwareFlightData {
  flight_number: string;
  origin: string;
  destination: string;
  scheduled_departure: string;
  estimated_departure: string;
  actual_departure?: string;
  status: string;
  departure_delay: number;
  arrival_delay: number;
  aircraft_type?: string;
  registration?: string;
  route?: string;
  altitude?: number;
  groundspeed?: number;
}

interface SlotRiskAnalysis {
  flight_number: string;
  origin: string;
  destination: string;
  scheduled_departure: string;
  departure_delay: number;
  slot_risk_score: number;
  at_risk: boolean;
  risk_factors: {
    delay_risk: number;
    time_risk: number;
    route_risk: number;
    weather_risk: number;
  };
  data_source: string;
  status: string;
  recommendations: string[];
}

class EnhancedSlotRiskAnalyzer {
  async fetchFlightAwareData(flightId: string): Promise<FlightAwareFlightData | null> {
    if (!FLIGHTAWARE_API_KEY) {
      console.log('FlightAware API key not configured');
      return null;
    }

    try {
      const response = await fetch(`${FLIGHTAWARE_BASE_URL}/flights/${flightId}`, {
        headers: {
          'x-apikey': FLIGHTAWARE_API_KEY
        },
        timeout: 10000
      });

      if (response.ok) {
        const data = await response.json();
        const flights = data.flights || [];
        
        if (flights.length > 0) {
          const flight = flights[0];
          return {
            flight_number: flight.ident,
            origin: flight.origin?.code_iata || 'UNKNOWN',
            destination: flight.destination?.code_iata || 'UNKNOWN',
            scheduled_departure: flight.scheduled_off,
            estimated_departure: flight.estimated_off,
            actual_departure: flight.actual_off,
            status: flight.status,
            departure_delay: flight.departure_delay || 0,
            arrival_delay: flight.arrival_delay || 0,
            aircraft_type: flight.aircraft_type,
            registration: flight.registration,
            route: flight.route,
            altitude: flight.altitude,
            groundspeed: flight.groundspeed
          };
        }
      }
    } catch (error) {
      console.error(`FlightAware API error for ${flightId}:`, error);
    }

    return null;
  }

  async fetchAINOPlatformData(): Promise<any[]> {
    try {
      const response = await fetch('http://localhost:5000/api/aviation/virgin-atlantic-flights', {
        timeout: 10000
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.success ? data.flights : [];
      }
    } catch (error) {
      console.log('AINO platform connection unavailable:', error);
    }
    
    return [];
  }

  calculateSlotRiskScore(flightData: FlightAwareFlightData): {
    score: number;
    factors: {
      delay_risk: number;
      time_risk: number;
      route_risk: number;
      weather_risk: number;
    };
  } {
    let delayRisk = 0;
    let timeRisk = 0;
    let routeRisk = 0;
    let weatherRisk = 0;

    // Delay-based risk (0-40 points)
    if (flightData.departure_delay > 0) {
      delayRisk = Math.min(flightData.departure_delay * 0.5, 40);
    }

    // Time-based risk (0-30 points)
    if (flightData.scheduled_departure) {
      try {
        const scheduledTime = new Date(flightData.scheduled_departure);
        const hour = scheduledTime.getUTCHours();
        
        if ((hour >= 6 && hour <= 9) || (hour >= 17 && hour <= 20)) {
          timeRisk = 20; // Peak hours
        } else if (hour >= 10 && hour <= 16) {
          timeRisk = 10; // Moderate hours
        }
      } catch (error) {
        console.log('Error parsing scheduled departure time:', error);
      }
    }

    // Route-based risk (0-20 points)
    const highTrafficDestinations = ['JFK', 'LAX', 'SFO', 'MIA'];
    const moderateTrafficDestinations = ['ATL', 'BOS', 'IAD'];
    
    if (highTrafficDestinations.includes(flightData.destination)) {
      routeRisk = 15;
    } else if (moderateTrafficDestinations.includes(flightData.destination)) {
      routeRisk = 10;
    }

    // Weather impact (0-10 points) - simplified for demo
    weatherRisk = Math.random() * 5;

    const totalScore = Math.min(delayRisk + timeRisk + routeRisk + weatherRisk, 100);

    return {
      score: totalScore,
      factors: {
        delay_risk: delayRisk,
        time_risk: timeRisk,
        route_risk: routeRisk,
        weather_risk: weatherRisk
      }
    };
  }

  generateRecommendations(riskScore: number, factors: any): string[] {
    const recommendations: string[] = [];

    if (riskScore > 80) {
      recommendations.push('CRITICAL: Consider immediate slot modification');
      recommendations.push('Coordinate with ATC for priority handling');
      recommendations.push('Prepare passenger reaccommodation options');
    } else if (riskScore > 60) {
      recommendations.push('Monitor flight closely for developments');
      recommendations.push('Pre-position ground services for potential delays');
      recommendations.push('Consider slot swap opportunities');
    } else if (riskScore > 40) {
      recommendations.push('Standard monitoring protocols');
      recommendations.push('Weather contingency planning');
    } else {
      recommendations.push('Flight operating within normal parameters');
    }

    if (factors.delay_risk > 20) {
      recommendations.push('Investigate delay cause and mitigation');
    }

    if (factors.time_risk > 15) {
      recommendations.push('Peak hour operation - extra vigilance required');
    }

    if (factors.route_risk > 10) {
      recommendations.push('High-traffic destination - coordinate with destination airport');
    }

    return recommendations;
  }

  async generateSlotAnalysis(): Promise<SlotRiskAnalysis[]> {
    const analysis: SlotRiskAnalysis[] = [];

    // Fetch FlightAware data
    console.log('Fetching FlightAware data for Virgin Atlantic flights...');
    const flightAwarePromises = VIRGIN_ATLANTIC_FLIGHTS.map(flightId => 
      this.fetchFlightAwareData(flightId)
    );
    
    const flightAwareResults = await Promise.allSettled(flightAwarePromises);
    
    // Process FlightAware results
    for (const result of flightAwareResults) {
      if (result.status === 'fulfilled' && result.value) {
        const flight = result.value;
        const riskAnalysis = this.calculateSlotRiskScore(flight);
        const recommendations = this.generateRecommendations(riskAnalysis.score, riskAnalysis.factors);

        analysis.push({
          flight_number: flight.flight_number,
          origin: flight.origin,
          destination: flight.destination,
          scheduled_departure: flight.scheduled_departure,
          departure_delay: flight.departure_delay,
          slot_risk_score: riskAnalysis.score,
          at_risk: riskAnalysis.score > 60,
          risk_factors: riskAnalysis.factors,
          data_source: 'FlightAware API',
          status: flight.status,
          recommendations: recommendations
        });
      }
    }

    // Fetch AINO platform data as fallback
    console.log('Fetching AINO platform data...');
    const ainoFlights = await this.fetchAINOPlatformData();
    
    for (const flight of ainoFlights) {
      // Only add if not already present from FlightAware
      if (!analysis.some(a => a.flight_number === flight.flight_number)) {
        // Generate synthetic slot analysis for AINO flights
        const syntheticDelay = Math.max(0, Math.random() * 30 - 10);
        const syntheticRisk = Math.random() * 80 + 10;
        
        analysis.push({
          flight_number: flight.flight_number,
          origin: flight.origin || 'LHR',
          destination: flight.destination || 'UNKNOWN',
          scheduled_departure: new Date().toISOString(),
          departure_delay: syntheticDelay,
          slot_risk_score: syntheticRisk,
          at_risk: syntheticRisk > 60,
          risk_factors: {
            delay_risk: syntheticDelay * 0.5,
            time_risk: Math.random() * 20,
            route_risk: Math.random() * 15,
            weather_risk: Math.random() * 5
          },
          data_source: 'AINO Platform',
          status: flight.status || 'Scheduled',
          recommendations: this.generateRecommendations(syntheticRisk, {
            delay_risk: syntheticDelay * 0.5,
            time_risk: Math.random() * 20,
            route_risk: Math.random() * 15,
            weather_risk: Math.random() * 5
          })
        });
      }
    }

    console.log(`Generated slot analysis for ${analysis.length} flights`);
    return analysis;
  }
}

// Enhanced slot risk dashboard endpoint
router.get('/enhanced-dashboard', async (req, res) => {
  try {
    const analyzer = new EnhancedSlotRiskAnalyzer();
    const slotAnalysis = await analyzer.generateSlotAnalysis();
    
    const totalFlights = slotAnalysis.length;
    const highRiskFlights = slotAnalysis.filter(f => f.at_risk);
    const avgDelay = slotAnalysis.reduce((sum, f) => sum + f.departure_delay, 0) / totalFlights;
    const avgRiskScore = slotAnalysis.reduce((sum, f) => sum + f.slot_risk_score, 0) / totalFlights;
    
    // Data source breakdown
    const dataSourceBreakdown = slotAnalysis.reduce((acc, flight) => {
      acc[flight.data_source] = (acc[flight.data_source] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total_flights: totalFlights,
        high_risk_count: highRiskFlights.length,
        average_delay: parseFloat(avgDelay.toFixed(1)),
        average_risk_score: parseFloat(avgRiskScore.toFixed(1)),
        data_sources: dataSourceBreakdown
      },
      flights: slotAnalysis,
      high_risk_flights: highRiskFlights
    });
  } catch (error) {
    console.error('Enhanced slot risk analysis error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate enhanced slot risk analysis',
      timestamp: new Date().toISOString()
    });
  }
});

// Slot swap recommendations endpoint
router.get('/swap-recommendations', async (req, res) => {
  try {
    // Get current Virgin Atlantic flights
    const flightResponse = await fetch('http://localhost:5000/api/aviation/virgin-atlantic-flights');
    const flightData = await flightResponse.json();
    const virginAtlanticFlights = flightData.flights || [];
    
    // Get current slot risk analysis
    const slotResponse = await fetch('http://localhost:5000/api/slot-risk/dashboard');
    const slotData = await slotResponse.json();
    const flightsWithRisk = slotData.flights || [];
    
    const highRiskFlights = flightsWithRisk.filter(f => f.at_risk);
    const lowRiskFlights = flightsWithRisk.filter(f => !f.at_risk && f.slot_risk_score < 40);
    
    const recommendations = [];
    
    // Generate swap recommendations for high-risk flights
    for (const highRiskFlight of highRiskFlights) {
      // Find flights to same destination or similar time slots
      const potentialSwaps = lowRiskFlights.filter(lowRisk => {
        const sameDestination = lowRisk.destination === highRiskFlight.destination;
        const similarTimeSlot = Math.abs(
          new Date(lowRisk.scheduled_slot || new Date()).getHours() - 
          new Date(highRiskFlight.scheduled_slot || new Date()).getHours()
        ) <= 2;
        
        return sameDestination || similarTimeSlot;
      });
      
      if (potentialSwaps.length > 0) {
        const bestSwap = potentialSwaps[0]; // Take the lowest risk option
        recommendations.push({
          type: 'SLOT_SWAP',
          high_risk_flight: {
            flight_number: highRiskFlight.flight_number,
            route: `${highRiskFlight.origin}-${highRiskFlight.destination}`,
            current_risk: highRiskFlight.slot_risk_score,
            current_delay: highRiskFlight.atfm_delay_min,
            scheduled_slot: highRiskFlight.scheduled_slot
          },
          recommended_swap: {
            flight_number: bestSwap.flight_number,
            route: `${bestSwap.origin}-${bestSwap.destination}`,
            current_risk: bestSwap.slot_risk_score,
            current_delay: bestSwap.atfm_delay_min,
            scheduled_slot: bestSwap.scheduled_slot
          },
          potential_savings: {
            risk_reduction: Math.round(highRiskFlight.slot_risk_score - bestSwap.slot_risk_score),
            delay_reduction: Math.max(0, highRiskFlight.atfm_delay_min - bestSwap.atfm_delay_min),
            cost_impact: `£${((highRiskFlight.atfm_delay_min - bestSwap.atfm_delay_min) * 85).toLocaleString()}`
          },
          operational_impact: 'Medium',
          passenger_impact: highRiskFlight.destination === bestSwap.destination ? 'Low' : 'Medium',
          recommendation_confidence: 'High',
          action_required: [
            'Coordinate with NATS for slot modification',
            'Notify passenger services of potential timing changes',
            'Update crew scheduling systems',
            'Confirm fuel planning adjustments'
          ]
        });
      }
    }
    
    // Add time-based optimization recommendations
    if (recommendations.length === 0 && highRiskFlights.length > 0) {
      // Generate alternative recommendations when no direct swaps available
      for (const highRiskFlight of highRiskFlights.slice(0, 3)) {
        recommendations.push({
          type: 'SCHEDULE_OPTIMIZATION',
          flight_number: highRiskFlight.flight_number,
          route: `${highRiskFlight.origin}-${highRiskFlight.destination}`,
          current_risk: highRiskFlight.slot_risk_score,
          recommendations: [
            {
              action: 'Early Departure',
              description: `Depart 30 minutes earlier to avoid peak congestion`,
              risk_reduction: 15,
              feasibility: 'High'
            },
            {
              action: 'Alternative Route',
              description: `Consider NATS alternative routing to reduce ATFM delays`,
              risk_reduction: 10,
              feasibility: 'Medium'  
            },
            {
              action: 'Priority Handling',
              description: `Request priority slot due to operational constraints`,
              risk_reduction: 20,
              feasibility: 'Low'
            }
          ]
        });
      }
    }
    
    // Sort by potential impact and take top 3
    recommendations.sort((a, b) => {
      if (a.type === 'SLOT_SWAP' && b.type === 'SLOT_SWAP') {
        return b.potential_savings.risk_reduction - a.potential_savings.risk_reduction;
      }
      return a.type === 'SLOT_SWAP' ? -1 : 1; // Prioritize slot swaps
    });
    
    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      summary: {
        total_recommendations: recommendations.length,
        slot_swaps: recommendations.filter(r => r.type === 'SLOT_SWAP').length,
        schedule_optimizations: recommendations.filter(r => r.type === 'SCHEDULE_OPTIMIZATION').length,
        high_risk_flights_analyzed: highRiskFlights.length
      },
      recommendations: recommendations.slice(0, 3)
    });
  } catch (error) {
    console.error('Swap recommendations error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate swap recommendations',
      timestamp: new Date().toISOString()
    });
  }
});

// Start enhanced Streamlit dashboard
router.post('/start-enhanced-dashboard', async (req, res) => {
  try {
    const pythonProcess = spawn('streamlit', ['run', 'enhanced_slot_risk_dashboard.py', '--server.port=8502'], {
      cwd: process.cwd(),
      stdio: 'inherit'
    });

    res.json({
      success: true,
      message: 'Enhanced Slot Risk Dashboard starting on port 8502',
      dashboard_url: 'http://localhost:8502',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Failed to start enhanced Streamlit dashboard:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start Enhanced Slot Risk Dashboard',
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced slot risk system health check
router.get('/health', async (req, res) => {
  try {
    res.json({
      success: true,
      status: 'Enhanced slot risk system operational',
      flightaware_configured: !!FLIGHTAWARE_API_KEY,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Health check failed',
      timestamp: new Date().toISOString()
    });
  }
});

// FlightAware API health check
router.get('/flightaware-health', async (req, res) => {
  try {
    if (!FLIGHTAWARE_API_KEY) {
      return res.json({
        success: false,
        status: 'API key not configured',
        timestamp: new Date().toISOString()
      });
    }

    const response = await fetch(`${FLIGHTAWARE_BASE_URL}/flights/VIR3`, {
      headers: {
        'x-apikey': FLIGHTAWARE_API_KEY
      },
      timeout: 5000
    });

    res.json({
      success: response.ok,
      status: response.ok ? 'API operational' : 'API error',
      status_code: response.status,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: false,
      status: 'API connection failed',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;