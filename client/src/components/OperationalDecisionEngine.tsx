import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, DollarSign, Users, Plane, MapPin, TrendingUp, Brain } from 'lucide-react';

interface FlightOperationalData {
  callsign: string;
  aircraft: string;
  route: string;
  currentPosition: { lat: number; lon: number };
  altitude: number;
  speed: number;
  fuelRemaining: number;
  weather: string;
  eta: string;
  passengers: number;
}

interface OperationalDecision {
  id: string;
  type: 'diversion' | 'delay' | 'fuel' | 'weather' | 'medical' | 'technical';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: {
    cost: number;
    delay: number;
    fuel: number;
    passengers: number;
  };
  recommendations: string[];
  timeline: string;
  approval_required: string[];
}

interface WeatherAlert {
  location: string;
  type: string;
  severity: string;
  impact: string;
  expires: string;
}

export default function OperationalDecisionEngine() {
  const [activeDecisions, setActiveDecisions] = useState<OperationalDecision[]>([]);
  const [flightData, setFlightData] = useState<FlightOperationalData | null>(null);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);
  const [systemStatus, setSystemStatus] = useState('analyzing');

  // Fetch live flight data
  useEffect(() => {
    const fetchOperationalData = async () => {
      try {
        // Get live flight data
        const flightResponse = await fetch('/api/aviation/virgin-atlantic-flights');
        const flightResult = await flightResponse.json();
        
        if (flightResult.success && flightResult.flights.length > 0) {
          const flight = flightResult.flights[0];
          setFlightData({
            callsign: flight.callsign,
            aircraft: flight.aircraft,
            route: `${flight.origin} → ${flight.destination}`,
            currentPosition: { lat: flight.latitude, lon: flight.longitude },
            altitude: flight.altitude,
            speed: flight.velocity,
            fuelRemaining: 75, // Mock data - would come from aircraft systems
            weather: 'Clear',
            eta: '14:30 UTC',
            passengers: 280
          });

          // Generate operational decisions based on live data
          generateOperationalDecisions(flight);
        }
      } catch (error) {
        console.error('Error fetching operational data:', error);
      }
    };

    fetchOperationalData();
    const interval = setInterval(fetchOperationalData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const generateOperationalDecisions = (flight: any) => {
    const decisions: OperationalDecision[] = [];
    
    // Fuel monitoring decision
    if (flight.altitude > 11000) {
      decisions.push({
        id: 'fuel-optimization',
        type: 'fuel',
        priority: 'medium',
        title: 'Fuel Optimization Opportunity',
        description: `${flight.callsign} is at optimal cruise altitude. Consider step climb for fuel efficiency.`,
        impact: {
          cost: -1200, // Negative = savings
          delay: 0,
          fuel: -350,
          passengers: 0
        },
        recommendations: [
          'Request FL390 step climb when traffic permits',
          'Monitor fuel burn rate vs. planned consumption',
          'Coordinate with dispatch for route optimization'
        ],
        timeline: 'Next 15 minutes',
        approval_required: ['ATC', 'Dispatch']
      });
    }

    // Weather contingency
    decisions.push({
      id: 'weather-routing',
      type: 'weather',
      priority: 'low',
      title: 'Weather Monitoring Active',
      description: 'Current conditions are favorable. Continue monitoring destination weather.',
      impact: {
        cost: 0,
        delay: 0,
        fuel: 0,
        passengers: 0
      },
      recommendations: [
        'Monitor destination METAR/TAF updates',
        'Prepare alternate airport fuel calculations',
        'Brief crew on potential weather changes'
      ],
      timeline: 'Continuous',
      approval_required: []
    });

    // Route efficiency
    const lat = Math.abs(flight.latitude);
    const lon = Math.abs(flight.longitude);
    
    if (lat > 50 && lon < 50) { // Over North Atlantic
      decisions.push({
        id: 'track-optimization',
        type: 'fuel',
        priority: 'medium',
        title: 'NAT Track Optimization',
        description: 'Aircraft is on North Atlantic route. Monitor for more efficient track assignments.',
        impact: {
          cost: -800,
          delay: 0,
          fuel: -200,
          passengers: 0
        },
        recommendations: [
          'Request track change if winds favorable',
          'Monitor other aircraft track reports',
          'Coordinate with Oceanic Control'
        ],
        timeline: 'Next 30 minutes',
        approval_required: ['Oceanic Control']
      });
    }

    setActiveDecisions(decisions);
    setSystemStatus('active');
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-500';
      case 'high': return 'bg-orange-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'fuel': return <TrendingUp className="h-4 w-4" />;
      case 'weather': return <AlertTriangle className="h-4 w-4" />;
      case 'diversion': return <MapPin className="h-4 w-4" />;
      case 'medical': return <Users className="h-4 w-4" />;
      default: return <Plane className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700 p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Brain className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Operational Decision Engine</h2>
          <div className={`px-2 py-1 rounded text-xs ${systemStatus === 'active' ? 'bg-green-600' : 'bg-yellow-600'} text-white`}>
            {systemStatus.toUpperCase()}
          </div>
        </div>
        <div className="text-sm text-gray-400">
          Real-time Analysis • {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Current Flight Context */}
      {flightData && (
        <div className="bg-gray-800/50 rounded-lg border border-gray-600 p-4 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <Plane className="h-5 w-5 text-blue-400" />
              <span className="text-white font-medium">{flightData.callsign}</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-300">{flightData.aircraft}</span>
            </div>
            <div className="text-sm text-gray-400">
              {flightData.route}
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-gray-400">Position</div>
              <div className="text-white">{flightData.currentPosition.lat.toFixed(2)}°, {flightData.currentPosition.lon.toFixed(2)}°</div>
            </div>
            <div>
              <div className="text-gray-400">Altitude/Speed</div>
              <div className="text-white">{Math.round(flightData.altitude)}ft / {Math.round(flightData.speed)}kts</div>
            </div>
            <div>
              <div className="text-gray-400">Fuel Remaining</div>
              <div className="text-white">{flightData.fuelRemaining}%</div>
            </div>
            <div>
              <div className="text-gray-400">ETA</div>
              <div className="text-white">{flightData.eta}</div>
            </div>
          </div>
        </div>
      )}

      {/* Active Operational Decisions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">
          Active Decisions ({activeDecisions.length})
        </h3>
        
        {activeDecisions.map((decision) => (
          <div key={decision.id} className="bg-gray-800/50 rounded-lg border border-gray-600 p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                {getTypeIcon(decision.type)}
                <div>
                  <h4 className="text-white font-medium">{decision.title}</h4>
                  <p className="text-gray-400 text-sm mt-1">{decision.description}</p>
                </div>
              </div>
              <div className={`px-2 py-1 rounded text-xs text-white ${getPriorityColor(decision.priority)}`}>
                {decision.priority.toUpperCase()}
              </div>
            </div>

            {/* Impact Analysis */}
            <div className="grid grid-cols-4 gap-4 mb-4 text-sm">
              <div className="bg-gray-700/50 rounded p-2">
                <div className="flex items-center gap-1 text-gray-400">
                  <DollarSign className="h-3 w-3" />
                  <span>Cost Impact</span>
                </div>
                <div className={`font-medium ${decision.impact.cost < 0 ? 'text-green-400' : decision.impact.cost > 0 ? 'text-red-400' : 'text-gray-300'}`}>
                  {decision.impact.cost < 0 ? '-' : ''}${Math.abs(decision.impact.cost)}
                </div>
              </div>
              <div className="bg-gray-700/50 rounded p-2">
                <div className="flex items-center gap-1 text-gray-400">
                  <Clock className="h-3 w-3" />
                  <span>Delay</span>
                </div>
                <div className="text-white font-medium">{decision.impact.delay} min</div>
              </div>
              <div className="bg-gray-700/50 rounded p-2">
                <div className="flex items-center gap-1 text-gray-400">
                  <TrendingUp className="h-3 w-3" />
                  <span>Fuel</span>
                </div>
                <div className={`font-medium ${decision.impact.fuel < 0 ? 'text-green-400' : decision.impact.fuel > 0 ? 'text-red-400' : 'text-gray-300'}`}>
                  {decision.impact.fuel < 0 ? '-' : ''}{Math.abs(decision.impact.fuel)} lbs
                </div>
              </div>
              <div className="bg-gray-700/50 rounded p-2">
                <div className="flex items-center gap-1 text-gray-400">
                  <Users className="h-3 w-3" />
                  <span>Passengers</span>
                </div>
                <div className="text-white font-medium">{decision.impact.passengers} affected</div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="mb-4">
              <div className="text-sm font-medium text-gray-300 mb-2">Recommendations:</div>
              <ul className="text-sm text-gray-400 space-y-1">
                {decision.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-400">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Action Timeline and Approvals */}
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="text-gray-400">Timeline: </span>
                <span className="text-white">{decision.timeline}</span>
              </div>
              <div className="text-sm">
                {decision.approval_required.length > 0 && (
                  <>
                    <span className="text-gray-400">Requires: </span>
                    <span className="text-yellow-400">{decision.approval_required.join(', ')}</span>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {activeDecisions.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <Brain className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>No active operational decisions</p>
            <p className="text-sm">System monitoring flight operations</p>
          </div>
        )}
      </div>
    </div>
  );
}