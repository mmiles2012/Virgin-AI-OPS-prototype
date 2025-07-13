import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Slider } from './ui/slider';
import { Switch } from './ui/switch';
import { MapPin, Plane, Clock, Fuel, DollarSign, AlertTriangle, TrendingUp, TrendingDown, Activity, Wrench, Zap, Eye, Heart } from 'lucide-react';

interface FlightScenario {
  id: string;
  flightNumber: string;
  aircraft: string;
  route: string;
  originalFuel: number;
  originalTime: number;
  originalCost: number;
  altitude: number;
  position: string;
}

interface FailureScenario {
  id: string;
  name: string;
  category: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  systems_affected: string[];
  diversion_required: boolean;
  fuel_burn_penalty: number;
  time_penalty: number;
  cost_multiplier: number;
  icon: string;
  operational_actions: string[];
  regulatory_considerations: string[];
  passenger_impact: string;
}

interface WeatherScenario {
  id: string;
  name: string;
  severity: 'MODERATE' | 'SEVERE' | 'EXTREME';
  wind_speed: number;
  visibility: number;
  precipitation: string;
  temperature: number;
  fuel_penalty: number;
  time_penalty: number;
  diversion_probability: number;
}

interface ScenarioModifications {
  failureType?: string;
  weatherCondition?: string;
  routeOptimization: string;
  altitudeChange: number;
  speedAdjustment: number;
  diversionAirport?: string;
  combinedScenarios: boolean;
  failureLocation?: {
    type: 'waypoint' | 'coordinates' | 'current';
    waypoint?: string;
    latitude?: number;
    longitude?: number;
    description?: string;
  };
}

interface ScenarioResults {
  fuelBurn: {
    original: number;
    modified: number;
    difference: number;
    percentage: number;
  };
  flightTime: {
    original: number;
    modified: number;
    difference: number;
    percentage: number;
  };
  operationalCost: {
    original: number;
    modified: number;
    difference: number;
    percentage: number;
  };
  riskFactors: {
    weather: string;
    fuel: string;
    time: string;
    overall: string;
  };
  recommendations: string[];
}

interface DiversionOption {
  icao: string;
  name: string;
  distance: number;
  fuelRequired: number;
  weatherSuitability: string;
  runwayLength: number;
  virginAtlanticSupport: boolean;
  estimatedCost: number;
}

export default function WhatIfScenarioEngine() {
  const [selectedFlight, setSelectedFlight] = useState<FlightScenario | null>(null);
  const [availableFlights, setAvailableFlights] = useState<FlightScenario[]>([]);
  const [selectedFailure, setSelectedFailure] = useState<FailureScenario | null>(null);
  const [selectedWeather, setSelectedWeather] = useState<WeatherScenario | null>(null);
  const [modifications, setModifications] = useState<ScenarioModifications>({
    routeOptimization: 'standard',
    altitudeChange: 0,
    speedAdjustment: 0,
    combinedScenarios: false,
    failureLocation: { type: 'current' }
  });
  const [results, setResults] = useState<ScenarioResults | null>(null);
  const [diversionOptions, setDiversionOptions] = useState<DiversionOption[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [realTimeComparison, setRealTimeComparison] = useState(false);
  const [activeTab, setActiveTab] = useState('flight-selection');

  // Comprehensive failure scenarios from digital twin profiles
  const failureScenarios: FailureScenario[] = [
    {
      id: 'engine_failure',
      name: 'Engine Failure',
      category: 'Propulsion',
      severity: 'HIGH',
      description: 'Single engine failure requiring drift-down and potential diversion',
      systems_affected: ['HYD 2', 'GEN 2', 'BLEED 2'],
      diversion_required: true,
      fuel_burn_penalty: 25,
      time_penalty: 45,
      cost_multiplier: 2.5,
      icon: '🔥',
      operational_actions: [
        'Execute engine failure checklist',
        'Configure for single-engine operations',
        'Evaluate nearest suitable diversion',
        'Coordinate with ATC for priority handling'
      ],
      regulatory_considerations: ['ETOPS compliance', 'Single-engine landing certification'],
      passenger_impact: 'Moderate - increased turbulence and potential diversion'
    },
    {
      id: 'decompression',
      name: 'Cabin Decompression',
      category: 'Environmental',
      severity: 'CRITICAL',
      description: 'Loss of cabin pressure requiring emergency descent',
      systems_affected: ['CABIN PRESS', 'OXY SYSTEM', 'PACK VALVES'],
      diversion_required: true,
      fuel_burn_penalty: 35,
      time_penalty: 55,
      cost_multiplier: 3.2,
      icon: '💨',
      operational_actions: [
        'Execute emergency descent',
        'Don oxygen masks',
        'Establish emergency communications',
        'Divert to nearest suitable airport'
      ],
      regulatory_considerations: ['Emergency descent procedures', 'Medical facilities required'],
      passenger_impact: 'High - emergency procedures and oxygen deployment'
    },
    {
      id: 'hydraulic_failure',
      name: 'Hydraulic System Failure',
      category: 'Flight Controls',
      severity: 'MEDIUM',
      description: 'Loss of primary hydraulic system affecting flight controls',
      systems_affected: ['PRIMARY FLT CTRL', 'LANDING GEAR', 'AUTOBRAKES'],
      diversion_required: false,
      fuel_burn_penalty: 15,
      time_penalty: 25,
      cost_multiplier: 1.8,
      icon: '🔧',
      operational_actions: [
        'Execute hydraulic failure checklist',
        'Configure for alternate control modes',
        'Plan for manual reversion landing',
        'Request emergency services on standby'
      ],
      regulatory_considerations: ['Manual flight control procedures', 'Extended approach required'],
      passenger_impact: 'Low - minimal passenger awareness'
    }
  ];

  // Common waypoints for Virgin Atlantic routes
  const commonWaypoints = [
    { code: 'EGLL', name: 'London Heathrow', lat: 51.4706, lon: -0.4619 },
    { code: 'KJFK', name: 'JFK New York', lat: 40.6413, lon: -73.7781 },
    { code: 'DOGAL', name: 'DOGAL Waypoint', lat: 51.5, lon: -8.5 },
    { code: 'Shannon', name: 'Shannon VOR', lat: 52.7019, lon: -8.9248 },
    { code: 'MALOT', name: 'MALOT Waypoint', lat: 50.0, lon: -20.0 },
    { code: 'TUDEP', name: 'TUDEP Waypoint', lat: 48.0, lon: -30.0 },
    { code: 'JANJO', name: 'JANJO Waypoint', lat: 45.0, lon: -40.0 },
    { code: 'OYSTR', name: 'OYSTR Waypoint', lat: 42.0, lon: -50.0 },
    { code: 'STEAM', name: 'STEAM Waypoint', lat: 40.0, lon: -60.0 },
    { code: 'KJFK', name: 'JFK Approach', lat: 40.6413, lon: -73.7781 }
  ];

  // Weather scenarios
  const weatherScenarios: WeatherScenario[] = [
    {
      id: 'severe_turbulence',
      name: 'Severe Turbulence',
      severity: 'SEVERE',
      wind_speed: 60,
      visibility: 5,
      precipitation: 'Heavy Rain',
      temperature: 15,
      fuel_penalty: 18,
      time_penalty: 25,
      diversion_probability: 0.3
    },
    {
      id: 'thunderstorm',
      name: 'Thunderstorm',
      severity: 'SEVERE',
      wind_speed: 45,
      visibility: 3,
      precipitation: 'Thunderstorm',
      temperature: 12,
      fuel_penalty: 22,
      time_penalty: 35,
      diversion_probability: 0.4
    }
  ];

  useEffect(() => {
    fetchAvailableFlights();
  }, []);

  const fetchAvailableFlights = async () => {
    try {
      const response = await fetch('/api/aviation/virgin-atlantic-flights');
      const data = await response.json();
      if (data.success) {
        const scenarios = data.flights.slice(0, 5).map((flight: any) => ({
          id: flight.callsign,
          flightNumber: flight.flight_number,
          aircraft: flight.aircraft,
          route: flight.route,
          originalFuel: 50000,
          originalTime: 6.2,
          originalCost: 44000,
          altitude: flight.altitude || 35000,
          position: flight.position || 'En Route'
        }));
        setAvailableFlights(scenarios);
      }
    } catch (error) {
      console.error('Failed to fetch flights:', error);
    }
  };

  const calculateScenario = async () => {
    if (!selectedFlight) return;
    
    setIsCalculating(true);
    try {
      const baseScenario = {
        fuel: selectedFlight.originalFuel,
        time: selectedFlight.originalTime,
        cost: selectedFlight.originalCost
      };

      let fuelImpact = 0;
      let timeImpact = 0;
      let costImpact = 1;

      // Apply failure scenario impacts
      if (selectedFailure) {
        fuelImpact += selectedFailure.fuel_burn_penalty;
        timeImpact += selectedFailure.time_penalty;
        costImpact = selectedFailure.cost_multiplier;
      }

      // Apply weather impacts
      if (selectedWeather) {
        fuelImpact += selectedWeather.fuel_penalty;
        timeImpact += selectedWeather.time_penalty;
      }

      const modifiedFuel = baseScenario.fuel * (1 + fuelImpact / 100);
      const modifiedTime = baseScenario.time * (1 + timeImpact / 100);
      const modifiedCost = baseScenario.cost * costImpact;

      setResults({
        fuelBurn: {
          original: baseScenario.fuel,
          modified: modifiedFuel,
          difference: modifiedFuel - baseScenario.fuel,
          percentage: fuelImpact
        },
        flightTime: {
          original: baseScenario.time,
          modified: modifiedTime,
          difference: modifiedTime - baseScenario.time,
          percentage: timeImpact
        },
        operationalCost: {
          original: baseScenario.cost,
          modified: modifiedCost,
          difference: modifiedCost - baseScenario.cost,
          percentage: ((costImpact - 1) * 100)
        },
        riskFactors: {
          weather: selectedWeather ? selectedWeather.severity.toLowerCase() : 'low',
          fuel: fuelImpact > 25 ? 'high' : 'medium',
          time: timeImpact > 40 ? 'high' : 'medium',
          overall: selectedFailure ? selectedFailure.severity.toLowerCase() : 'low'
        },
        recommendations: [
          'Monitor fuel consumption closely',
          'Maintain communication with operations center',
          'Consider alternate routing if conditions worsen'
        ]
      });

      if (selectedFailure?.diversion_required) {
        await fetchDiversionOptions();
      }

      // Add location-specific considerations
      if (modifications.failureLocation?.type !== 'current') {
        const locationInfo = getLocationInfo(modifications.failureLocation);
        if (locationInfo) {
          setResults(prev => prev ? {
            ...prev,
            recommendations: [
              ...prev.recommendations,
              `Failure location: ${locationInfo}`,
              'Consider proximity to alternate airports and overwater procedures'
            ]
          } : prev);
        }
      }
    } catch (error) {
      console.error('Scenario calculation failed:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const getLocationInfo = (location: any) => {
    if (location.type === 'waypoint' && location.waypoint) {
      const waypoint = commonWaypoints.find(w => w.code === location.waypoint);
      return `${location.waypoint} (${waypoint?.name || 'Unknown waypoint'})`;
    }
    if (location.type === 'coordinates' && location.latitude && location.longitude) {
      const lat = location.latitude.toFixed(4);
      const lon = Math.abs(location.longitude).toFixed(4);
      const lonDir = location.longitude < 0 ? 'W' : 'E';
      return `${lat}°N, ${lon}°${lonDir}`;
    }
    return null;
  };

  const fetchDiversionOptions = async () => {
    setDiversionOptions([
      {
        icao: 'EINN',
        name: 'Shannon Airport',
        distance: 450,
        fuelRequired: 12500,
        weatherSuitability: 'Good',
        runwayLength: 10495,
        virginAtlanticSupport: true,
        estimatedCost: 85000
      },
      {
        icao: 'EGPF',
        name: 'Glasgow International',
        distance: 380,
        fuelRequired: 10200,
        weatherSuitability: 'Good',
        runwayLength: 8652,
        virginAtlanticSupport: true,
        estimatedCost: 75000
      }
    ]);
  };

  return (
    <div className="w-full h-full bg-gray-900 text-white p-6 overflow-y-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">What-If Scenario Engine</h1>
        <p className="text-gray-400">Comprehensive failure modeling and digital twin integration</p>
        <div className="flex items-center space-x-4 mt-4">
          <Switch
            checked={realTimeComparison}
            onCheckedChange={setRealTimeComparison}
            className="data-[state=checked]:bg-yellow-600"
          />
          <label className="text-sm">Real-time Comparison</label>
          <Badge variant="outline" className="text-yellow-400 border-yellow-400">
            Enhanced Digital Twin Integration
          </Badge>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5 bg-gray-800">
          <TabsTrigger value="flight-selection">Flight Selection</TabsTrigger>
          <TabsTrigger value="failure-scenarios">Failure Scenarios</TabsTrigger>
          <TabsTrigger value="weather-scenarios">Weather Scenarios</TabsTrigger>
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="diversions">Diversion Options</TabsTrigger>
        </TabsList>

        <TabsContent value="flight-selection" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plane className="w-5 h-5" />
                  Flight Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {availableFlights.map((flight) => (
                  <div
                    key={flight.id}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedFlight?.id === flight.id
                        ? 'border-yellow-500 bg-yellow-500/10'
                        : 'border-gray-600 hover:border-gray-500'
                    }`}
                    onClick={() => setSelectedFlight(flight)}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-medium text-white">{flight.flightNumber}</h3>
                        <p className="text-sm text-gray-400">{flight.route}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {flight.aircraft}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs text-gray-400">
                      <div>Fuel: {(flight.originalFuel / 1000).toFixed(1)}k kg</div>
                      <div>Time: {flight.originalTime.toFixed(1)}h</div>
                      <div>Cost: ${(flight.originalCost / 1000).toFixed(0)}k</div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {selectedFlight && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Flight Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-gray-400">Flight Number</Label>
                      <p className="text-white">{selectedFlight.flightNumber}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Aircraft</Label>
                      <p className="text-white">{selectedFlight.aircraft}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Route</Label>
                      <p className="text-white">{selectedFlight.route}</p>
                    </div>
                    <div>
                      <Label className="text-gray-400">Altitude</Label>
                      <p className="text-white">{selectedFlight.altitude.toLocaleString()} ft</p>
                    </div>
                  </div>
                  <Button
                    onClick={calculateScenario}
                    disabled={isCalculating}
                    className="w-full bg-yellow-600 hover:bg-yellow-700 text-white"
                  >
                    {isCalculating ? 'Calculating...' : 'Run Scenario Analysis'}
                  </Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="failure-scenarios" className="mt-6">
          <div className="space-y-6">
            {/* Failure Location Selection */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Failure Location
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label className="text-white">Location Type</Label>
                    <Select
                      value={modifications.failureLocation?.type || 'current'}
                      onValueChange={(value: 'waypoint' | 'coordinates' | 'current') =>
                        setModifications(prev => ({
                          ...prev,
                          failureLocation: { type: value }
                        }))
                      }
                    >
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-700 border-gray-600">
                        <SelectItem value="current" className="text-white hover:bg-gray-600">Current Position</SelectItem>
                        <SelectItem value="waypoint" className="text-white hover:bg-gray-600">Flight Plan Waypoint</SelectItem>
                        <SelectItem value="coordinates" className="text-white hover:bg-gray-600">Custom Coordinates</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {modifications.failureLocation?.type === 'waypoint' && (
                    <div className="space-y-2">
                      <Label className="text-white">Waypoint</Label>
                      <Select
                        value={modifications.failureLocation?.waypoint || ''}
                        onValueChange={(waypoint) =>
                          setModifications(prev => ({
                            ...prev,
                            failureLocation: {
                              ...prev.failureLocation!,
                              waypoint,
                              description: commonWaypoints.find(w => w.code === waypoint)?.name
                            }
                          }))
                        }
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Select waypoint" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          {commonWaypoints.map((wp) => (
                            <SelectItem key={wp.code} value={wp.code} className="text-white hover:bg-gray-600">
                              {wp.code} - {wp.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {modifications.failureLocation?.type === 'coordinates' && (
                    <>
                      <div className="space-y-2">
                        <Label className="text-white">Latitude</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          min="-90"
                          max="90"
                          placeholder="51.4706"
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          value={modifications.failureLocation?.latitude || ''}
                          onChange={(e) =>
                            setModifications(prev => ({
                              ...prev,
                              failureLocation: {
                                ...prev.failureLocation!,
                                latitude: parseFloat(e.target.value) || undefined
                              }
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-white">Longitude</Label>
                        <Input
                          type="number"
                          step="0.0001"
                          min="-180"
                          max="180"
                          placeholder="-0.4619"
                          className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
                          value={modifications.failureLocation?.longitude || ''}
                          onChange={(e) =>
                            setModifications(prev => ({
                              ...prev,
                              failureLocation: {
                                ...prev.failureLocation!,
                                longitude: parseFloat(e.target.value) || undefined
                              }
                            }))
                          }
                        />
                      </div>
                    </>
                  )}
                </div>

                {modifications.failureLocation?.type !== 'current' && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="w-4 h-4 text-blue-400" />
                      <span className="text-blue-400 font-medium">Selected Location</span>
                    </div>
                    {modifications.failureLocation?.type === 'waypoint' && modifications.failureLocation?.waypoint && (
                      <p className="text-sm text-gray-300">
                        {modifications.failureLocation.waypoint} - {modifications.failureLocation.description}
                      </p>
                    )}
                    {modifications.failureLocation?.type === 'coordinates' && 
                     modifications.failureLocation?.latitude && 
                     modifications.failureLocation?.longitude && (
                      <p className="text-sm text-gray-300">
                        {modifications.failureLocation.latitude.toFixed(4)}°N, {Math.abs(modifications.failureLocation.longitude).toFixed(4)}°{modifications.failureLocation.longitude < 0 ? 'W' : 'E'}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Failure Scenarios */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {failureScenarios.map((scenario) => (
              <Card
                key={scenario.id}
                className={`bg-gray-800 border-gray-700 cursor-pointer transition-colors ${
                  selectedFailure?.id === scenario.id
                    ? 'border-red-500 bg-red-500/10'
                    : 'hover:border-gray-500'
                }`}
                onClick={() => setSelectedFailure(scenario)}
              >
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <span className="text-xl">{scenario.icon}</span>
                    {scenario.name}
                  </CardTitle>
                  <Badge
                    variant="outline"
                    className={`w-fit ${
                      scenario.severity === 'CRITICAL' ? 'border-red-500 text-red-400' :
                      scenario.severity === 'HIGH' ? 'border-orange-500 text-orange-400' :
                      scenario.severity === 'MEDIUM' ? 'border-yellow-500 text-yellow-400' :
                      'border-green-500 text-green-400'
                    }`}
                  >
                    {scenario.severity}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-400 text-sm mb-4">{scenario.description}</p>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-gray-500">Systems Affected</Label>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {scenario.systems_affected.map((system, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {system}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <Label className="text-gray-500">Fuel Impact</Label>
                        <p className="text-red-400">+{scenario.fuel_burn_penalty}%</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Time Impact</Label>
                        <p className="text-yellow-400">+{scenario.time_penalty}min</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Cost Impact</Label>
                        <p className="text-orange-400">{scenario.cost_multiplier}x</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="weather-scenarios" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {weatherScenarios.map((weather) => (
              <Card
                key={weather.id}
                className={`bg-gray-800 border-gray-700 cursor-pointer transition-colors ${
                  selectedWeather?.id === weather.id
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'hover:border-gray-500'
                }`}
                onClick={() => setSelectedWeather(weather)}
              >
                <CardHeader>
                  <CardTitle className="text-white">{weather.name}</CardTitle>
                  <Badge
                    variant="outline"
                    className={`w-fit ${
                      weather.severity === 'EXTREME' ? 'border-red-500 text-red-400' :
                      weather.severity === 'SEVERE' ? 'border-orange-500 text-orange-400' :
                      'border-yellow-500 text-yellow-400'
                    }`}
                  >
                    {weather.severity}
                  </Badge>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <Label className="text-gray-500">Wind Speed</Label>
                      <p className="text-white">{weather.wind_speed} kt</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Visibility</Label>
                      <p className="text-white">{weather.visibility} miles</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Precipitation</Label>
                      <p className="text-white">{weather.precipitation}</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Temperature</Label>
                      <p className="text-white">{weather.temperature}°C</p>
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <Label className="text-gray-500">Fuel Penalty</Label>
                      <p className="text-red-400">+{weather.fuel_penalty}%</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Time Penalty</Label>
                      <p className="text-yellow-400">+{weather.time_penalty}min</p>
                    </div>
                    <div>
                      <Label className="text-gray-500">Diversion Risk</Label>
                      <p className="text-orange-400">{(weather.diversion_probability * 100)}%</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analysis" className="mt-6">
          {results ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Performance Impact</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                      <div className="flex items-center gap-2">
                        <Fuel className="w-4 h-4 text-blue-400" />
                        <span className="text-gray-300">Fuel Burn</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white">{(results.fuelBurn.modified / 1000).toFixed(1)}k kg</p>
                        <p className={`text-xs ${results.fuelBurn.percentage > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {results.fuelBurn.percentage > 0 ? '+' : ''}{results.fuelBurn.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-yellow-400" />
                        <span className="text-gray-300">Flight Time</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white">{results.flightTime.modified.toFixed(1)}h</p>
                        <p className={`text-xs ${results.flightTime.percentage > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {results.flightTime.percentage > 0 ? '+' : ''}{results.flightTime.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-700 rounded">
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-green-400" />
                        <span className="text-gray-300">Operational Cost</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white">${(results.operationalCost.modified / 1000).toFixed(0)}k</p>
                        <p className={`text-xs ${results.operationalCost.percentage > 0 ? 'text-red-400' : 'text-green-400'}`}>
                          {results.operationalCost.percentage > 0 ? '+' : ''}{results.operationalCost.percentage.toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white">Risk Assessment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Location Information */}
                  {modifications.failureLocation?.type !== 'current' && (
                    <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded">
                      <div className="flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span className="text-blue-400 font-medium">Failure Location</span>
                      </div>
                      <p className="text-sm text-gray-300">
                        {getLocationInfo(modifications.failureLocation)}
                      </p>
                      {modifications.failureLocation?.type === 'waypoint' && (
                        <p className="text-xs text-gray-400 mt-1">
                          Flight plan waypoint - consider impact on route and fuel planning
                        </p>
                      )}
                      {modifications.failureLocation?.type === 'coordinates' && (
                        <p className="text-xs text-gray-400 mt-1">
                          Custom coordinates - verify proximity to alternate airports
                        </p>
                      )}
                    </div>
                  )}
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-gray-700 rounded">
                        <Label className="text-gray-400">Weather Risk</Label>
                        <p className={`font-medium ${
                          results.riskFactors.weather === 'high' ? 'text-red-400' :
                          results.riskFactors.weather === 'medium' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {results.riskFactors.weather.toUpperCase()}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-700 rounded">
                        <Label className="text-gray-400">Fuel Risk</Label>
                        <p className={`font-medium ${
                          results.riskFactors.fuel === 'high' ? 'text-red-400' :
                          results.riskFactors.fuel === 'medium' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {results.riskFactors.fuel.toUpperCase()}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-700 rounded">
                        <Label className="text-gray-400">Time Risk</Label>
                        <p className={`font-medium ${
                          results.riskFactors.time === 'high' ? 'text-red-400' :
                          results.riskFactors.time === 'medium' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {results.riskFactors.time.toUpperCase()}
                        </p>
                      </div>
                      <div className="p-3 bg-gray-700 rounded">
                        <Label className="text-gray-400">Overall Risk</Label>
                        <p className={`font-medium ${
                          results.riskFactors.overall === 'high' || results.riskFactors.overall === 'critical' ? 'text-red-400' :
                          results.riskFactors.overall === 'medium' ? 'text-yellow-400' :
                          'text-green-400'
                        }`}>
                          {results.riskFactors.overall.toUpperCase()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-gray-400">Recommendations</Label>
                      <ul className="mt-2 space-y-1">
                        {results.recommendations.map((rec, idx) => (
                          <li key={idx} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="text-yellow-400 mt-1">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Analysis Available</h3>
              <p className="text-gray-400 mb-4">Select a flight and run scenario analysis to see results</p>
              <Button
                onClick={() => setActiveTab('flight-selection')}
                className="bg-yellow-600 hover:bg-yellow-700 text-white"
              >
                Select Flight
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="diversions" className="mt-6">
          {diversionOptions.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {diversionOptions.map((option) => (
                <Card key={option.icao} className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                      <MapPin className="w-5 h-5" />
                      {option.name}
                    </CardTitle>
                    <Badge variant="outline" className="w-fit">
                      {option.icao}
                    </Badge>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <Label className="text-gray-500">Distance</Label>
                        <p className="text-white">{option.distance} nm</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Fuel Required</Label>
                        <p className="text-white">{(option.fuelRequired / 1000).toFixed(1)}k kg</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Runway Length</Label>
                        <p className="text-white">{option.runwayLength.toLocaleString()} ft</p>
                      </div>
                      <div>
                        <Label className="text-gray-500">Weather</Label>
                        <p className={`${
                          option.weatherSuitability === 'Good' ? 'text-green-400' :
                          option.weatherSuitability === 'Moderate' ? 'text-yellow-400' :
                          'text-red-400'
                        }`}>
                          {option.weatherSuitability}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-700 rounded">
                      <span className="text-gray-300">Virgin Atlantic Support</span>
                      <Badge variant={option.virginAtlanticSupport ? "default" : "secondary"}>
                        {option.virginAtlanticSupport ? 'Available' : 'Limited'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400">Estimated Cost</span>
                      <span className="text-white font-medium">${(option.estimatedCost / 1000).toFixed(0)}k</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-white mb-2">No Diversion Options Available</h3>
              <p className="text-gray-400 mb-4">Configure failure scenarios that require diversion to see options</p>
              <Button
                onClick={() => setActiveTab('failure-scenarios')}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Configure Failures
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}