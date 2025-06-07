import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, DollarSign, Users, Plane, MapPin, TrendingUp, Brain, Gauge, Zap } from 'lucide-react';
import { useSelectedFlight } from '../lib/stores/useSelectedFlight';
import { useScenario } from '../lib/stores/useScenario';
import { AircraftPerformanceCalculator, EMERGENCY_SCENARIOS, BOEING_787_SPECS, AIRBUS_A350_SPECS } from '../lib/aircraftPerformance';

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
  const [manualScenario, setManualScenario] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const { selectedFlight } = useSelectedFlight();
  const { startScenario, stopScenario } = useScenario();

  // Convert selected flight to operational data format
  useEffect(() => {
    if (selectedFlight) {
      setFlightData({
        callsign: selectedFlight.callsign,
        aircraft: selectedFlight.aircraft,
        route: `${selectedFlight.origin} → ${selectedFlight.destination}`,
        currentPosition: { lat: selectedFlight.latitude, lon: selectedFlight.longitude },
        altitude: selectedFlight.altitude,
        speed: selectedFlight.velocity,
        fuelRemaining: 85, // Calculated based on route progress
        weather: 'Fair',
        eta: '14:25 UTC',
        passengers: selectedFlight.callsign.includes('401') ? 298 : 245
      });
    } else {
      setFlightData(null);
    }
  }, [selectedFlight]);

  // Generate decisions when flight data changes
  useEffect(() => {
    if (flightData) {
      generateOperationalDecisions(flightData);
      updatePerformanceCalculations(flightData);
    } else {
      setActiveDecisions([]);
      setPerformanceData(null);
    }
  }, [flightData, manualScenario]);

  const updatePerformanceCalculations = (flight: FlightOperationalData) => {
    const scenarioType = manualScenario || 'normal';
    
    // Calculate emergency impact on aircraft performance
    const performanceImpact = performanceCalculator.calculateEmergencyImpact(
      {
        altitude: flight.altitude,
        fuelRemaining: BOEING_787_SPECS.maxFuel * (flight.fuelRemaining / 100), // Convert percentage to kg
        speed: flight.speed
      },
      scenarioType
    );

    // Get scenario impact summary
    const impactSummary = performanceCalculator.getScenarioImpactSummary(scenarioType);

    setPerformanceData({
      ...performanceImpact,
      ...impactSummary,
      normalSpecs: BOEING_787_SPECS
    });
  };

  const generateOperationalDecisions = (flight: FlightOperationalData) => {
    const decisions: OperationalDecision[] = [];
    const lat = Math.abs(flight.currentPosition.lat);
    const lon = Math.abs(flight.currentPosition.lon);
    const currentTime = new Date().getHours();
    
    // Simulate non-normal scenarios based on flight parameters
    const scenarios = detectNonNormalScenarios(flight, lat, lon, currentTime);
    
    // Medical emergency scenario (simulated based on flight characteristics)
    if (scenarios.medical) {
      decisions.push({
        id: 'medical-diversion',
        type: 'medical',
        priority: 'critical',
        title: 'Medical Emergency - Diversion Required',
        description: `${flight.callsign} reports medical emergency. Immediate diversion to nearest suitable airport.`,
        impact: {
          cost: 45000,
          delay: 180,
          fuel: 2800,
          passengers: 280
        },
        recommendations: [
          'Identify nearest airport with medical facilities',
          'Coordinate with emergency medical services',
          'Prepare passenger rebooking options',
          'Notify insurance and legal teams',
          'Brief crew on emergency procedures'
        ],
        timeline: 'IMMEDIATE - 15 minutes to decision',
        approval_required: ['Captain', 'Dispatch', 'Medical']
      });
    }

    // Technical malfunction scenario
    if (scenarios.technical) {
      decisions.push({
        id: 'technical-assessment',
        type: 'technical',
        priority: 'high',
        title: 'Engine Parameter Monitoring',
        description: `${flight.callsign} reports engine parameter anomaly. Assess continuation vs. precautionary landing.`,
        impact: {
          cost: 25000,
          delay: 120,
          fuel: 1500,
          passengers: 280
        },
        recommendations: [
          'Contact maintenance control for technical assessment',
          'Review MEL procedures for continued flight',
          'Identify alternate airports along route',
          'Prepare for possible precautionary landing',
          'Monitor engine parameters continuously'
        ],
        timeline: 'Next 30 minutes',
        approval_required: ['Captain', 'Maintenance', 'Dispatch']
      });
    }

    // Severe weather scenario
    if (scenarios.weather) {
      decisions.push({
        id: 'weather-diversion',
        type: 'weather',
        priority: 'high',
        title: 'Severe Weather Avoidance',
        description: `Thunderstorms reported at destination. Consider alternate airports or delay.`,
        impact: {
          cost: 18000,
          delay: 90,
          fuel: 1200,
          passengers: 280
        },
        recommendations: [
          'Monitor destination weather radar',
          'Calculate fuel for holding patterns',
          'Prepare alternate airport options',
          'Coordinate with ATC for routing around weather',
          'Brief passengers on potential delays'
        ],
        timeline: 'Next 45 minutes',
        approval_required: ['Captain', 'Dispatch', 'ATC']
      });
    }

    // Security scenario
    if (scenarios.security) {
      decisions.push({
        id: 'security-assessment',
        type: 'medical', // Using medical type for security
        priority: 'critical',
        title: 'Security Incident Assessment',
        description: `${flight.callsign} reports disruptive passenger. Assess threat level and response.`,
        impact: {
          cost: 35000,
          delay: 150,
          fuel: 2000,
          passengers: 280
        },
        recommendations: [
          'Assess passenger threat level with cabin crew',
          'Consider restraint procedures if necessary',
          'Prepare for possible diversion to nearest airport',
          'Coordinate with law enforcement at destination',
          'Document incident for regulatory reporting'
        ],
        timeline: 'IMMEDIATE - Ongoing assessment',
        approval_required: ['Captain', 'Cabin Crew', 'Security']
      });
    }

    // Normal operations - fuel optimization
    if (scenarios.normal && flight.altitude > 11000) {
      decisions.push({
        id: 'fuel-optimization',
        type: 'fuel',
        priority: 'medium',
        title: 'Fuel Optimization Opportunity',
        description: `${flight.callsign} at cruise altitude. Monitor for fuel efficiency improvements.`,
        impact: {
          cost: -1200,
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

    // Route efficiency for Mediterranean flights
    if (lat > 35 && lat < 45 && lon > 15 && lon < 30) {
      decisions.push({
        id: 'mediterranean-routing',
        type: 'fuel',
        priority: 'medium',
        title: 'Mediterranean Route Optimization',
        description: 'Aircraft over Mediterranean. Monitor for direct routing opportunities.',
        impact: {
          cost: -600,
          delay: -5,
          fuel: -180,
          passengers: 0
        },
        recommendations: [
          'Request direct routing to next waypoint',
          'Monitor other traffic for conflicts',
          'Coordinate with European ATC centers'
        ],
        timeline: 'Next 20 minutes',
        approval_required: ['European ATC']
      });
    }

    setActiveDecisions(decisions);
    setSystemStatus(decisions.some(d => d.priority === 'critical') ? 'critical' : 'active');
  };

  const detectNonNormalScenarios = (flight: FlightOperationalData, lat: number, lon: number, currentTime: number) => {
    const scenarios = {
      medical: false,
      technical: false,
      weather: false,
      security: false,
      normal: true
    };

    // Manual scenario override
    if (manualScenario) {
      scenarios[manualScenario as keyof typeof scenarios] = true;
      scenarios.normal = false;
      return scenarios;
    }

    // Time-based automatic scenarios for demonstration
    if (currentTime >= 12 && currentTime <= 14) {
      scenarios.medical = true;
      scenarios.normal = false;
    } else if (currentTime >= 14 && currentTime <= 16) {
      scenarios.weather = true;
      scenarios.normal = false;
    } else if (currentTime >= 8 && currentTime <= 10) {
      scenarios.technical = true;
      scenarios.normal = false;
    } else if (currentTime >= 18 && currentTime <= 20) {
      scenarios.security = true;
      scenarios.normal = false;
    }

    return scenarios;
  };

  const triggerScenario = (scenarioType: string) => {
    setManualScenario(scenarioType);
    
    // Create a scenario for the scenario store
    const scenario = {
      id: `manual-${scenarioType}`,
      title: scenarioType === 'medical' ? 'Medical Emergency Response' :
             scenarioType === 'technical' ? 'Engine Failure in Cruise' :
             scenarioType === 'weather' ? 'Severe Weather Avoidance' :
             scenarioType === 'security' ? 'Security Incident Response' : 'Operational Scenario',
      description: `Manual ${scenarioType} scenario triggered for operational decision support`,
      type: scenarioType as 'medical' | 'technical' | 'weather' | 'security',
      severity: 'high' as 'low' | 'medium' | 'high',
      estimatedDuration: '30 minutes',
      learningObjectives: [`Manage ${scenarioType} situation effectively`],
      emergencyDetails: scenarioType === 'medical' ? {
        type: 'cardiac',
        severity: 'high',
        symptoms: ['chest pain', 'difficulty breathing'],
        immediateActions: ['oxygen', 'position patient', 'prepare for diversion'],
        diversionRequired: true,
        timeToStabilize: 30,
        medicalEquipmentNeeded: ['AED', 'oxygen'],
        passengerAge: 58,
        passengerCondition: 'critical'
      } : undefined,
      decisionPoints: [],
      successCriteria: [`Successfully resolve ${scenarioType} scenario`]
    };
    
    startScenario(scenario);
    
    if (flightData) {
      // Re-generate decisions with the manual scenario
      const flight = {
        ...flightData,
        callsign: flightData.callsign,
        latitude: flightData.currentPosition.lat,
        longitude: flightData.currentPosition.lon,
        altitude: flightData.altitude
      };
      generateOperationalDecisions(flight);
    }
  };

  const clearScenario = () => {
    setManualScenario(null);
    stopScenario();
    
    if (flightData) {
      const flight = {
        ...flightData,
        callsign: flightData.callsign,
        latitude: flightData.currentPosition.lat,
        longitude: flightData.currentPosition.lon,
        altitude: flightData.altitude
      };
      generateOperationalDecisions(flight);
    }
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

      {/* Scenario Triggers */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-600 p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-white">Scenario Testing</h3>
          {manualScenario && (
            <button
              onClick={clearScenario}
              className="bg-gray-600 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
            >
              Clear Active Scenario
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <button
            onClick={() => triggerScenario('medical')}
            className={`p-3 rounded text-sm font-medium transition-colors ${
              manualScenario === 'medical' 
                ? 'bg-red-600 text-white' 
                : 'bg-red-600/20 border border-red-500 text-red-400 hover:bg-red-600/30'
            }`}
          >
            Medical Emergency
          </button>
          <button
            onClick={() => triggerScenario('technical')}
            className={`p-3 rounded text-sm font-medium transition-colors ${
              manualScenario === 'technical'
                ? 'bg-orange-600 text-white'
                : 'bg-orange-600/20 border border-orange-500 text-orange-400 hover:bg-orange-600/30'
            }`}
          >
            Technical Issue
          </button>
          <button
            onClick={() => triggerScenario('weather')}
            className={`p-3 rounded text-sm font-medium transition-colors ${
              manualScenario === 'weather'
                ? 'bg-yellow-600 text-white'
                : 'bg-yellow-600/20 border border-yellow-500 text-yellow-400 hover:bg-yellow-600/30'
            }`}
          >
            Severe Weather
          </button>
          <button
            onClick={() => triggerScenario('security')}
            className={`p-3 rounded text-sm font-medium transition-colors ${
              manualScenario === 'security'
                ? 'bg-purple-600 text-white'
                : 'bg-purple-600/20 border border-purple-500 text-purple-400 hover:bg-purple-600/30'
            }`}
          >
            Security Incident
          </button>
        </div>
        {manualScenario && (
          <div className="mt-3 text-sm text-yellow-400">
            Active Scenario: {manualScenario.charAt(0).toUpperCase() + manualScenario.slice(1)} - Decision recommendations updated
          </div>
        )}
      </div>

      {/* Boeing 787 Performance Impact */}
      {performanceData && flightData && (
        <div className="bg-gray-800/50 rounded-lg border border-gray-600 p-4 mb-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Gauge className="h-5 w-5 text-blue-400" />
            Boeing 787 Performance Impact Analysis
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-4">
            {/* Fuel Consumption Impact */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-md font-medium text-white mb-3 flex items-center gap-2">
                <Zap className="h-4 w-4 text-yellow-400" />
                Fuel Consumption Impact
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Normal Burn Rate:</span>
                  <span className="text-white font-medium">{performanceData.normalSpecs.normalCruiseBurn} kg/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Burn Rate:</span>
                  <span className="text-red-400 font-medium">{Math.round(performanceData.fuelBurnRate)} kg/hr</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Increase:</span>
                  <span className="text-red-400 font-medium">
                    +{Math.round(performanceData.fuelBurnRate - performanceData.normalSpecs.normalCruiseBurn)} kg/hr 
                    ({performanceData.fuelIncreasePercent.toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* Range Impact */}
            <div className="bg-gray-700/50 rounded-lg p-4">
              <h4 className="text-md font-medium text-white mb-3 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-green-400" />
                Range Impact
              </h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Normal Max Range:</span>
                  <span className="text-white font-medium">{performanceData.normalSpecs.maxRange} nm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Current Range:</span>
                  <span className="text-red-400 font-medium">{performanceData.range} nm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Range Reduction:</span>
                  <span className="text-red-400 font-medium">
                    -{performanceData.rangeReduction} nm ({((performanceData.rangeReduction / performanceData.normalSpecs.maxRange) * 100).toFixed(1)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Operational Recommendations */}
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="text-md font-medium text-white mb-3">Emergency Impact Analysis</h4>
            <p className="text-gray-300 text-sm mb-3">{performanceData.scenario.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-gray-400 mb-2">Flight Parameters</div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Altitude:</span>
                    <span className="text-white">{performanceData.altitude.toLocaleString()} ft</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Current Speed:</span>
                    <span className="text-white">{performanceData.speed} kts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Time Remaining:</span>
                    <span className="text-white">{performanceData.timeRemaining.toFixed(1)} hrs</span>
                  </div>
                </div>
              </div>
              <div>
                <div className="text-xs text-gray-400 mb-2">Emergency Status</div>
                <div className="space-y-1 text-sm">
                  <div className={`font-medium ${
                    performanceData.scenario.diversionRequired ? 'text-red-400' : 'text-yellow-400'
                  }`}>
                    {performanceData.scenario.diversionRequired ? 'DIVERSION REQUIRED' : 'CONTINUE MONITORING'}
                  </div>
                  <div className="text-gray-300">
                    Stabilize Time: {performanceData.scenario.timeToStabilize} min
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Operational Decisions */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-white mb-4">
          Operational Recommendations ({activeDecisions.length})
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

        {!flightData ? (
          <div className="text-center py-16 text-gray-400">
            <Brain className="h-16 w-16 mx-auto mb-4 opacity-50" />
            <p className="text-lg mb-2">No flight selected for analysis</p>
            <p className="text-sm max-w-md mx-auto">
              Select a flight from the satellite map to view operational recommendations and decision support analysis
            </p>
          </div>
        ) : activeDecisions.length === 0 && (
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