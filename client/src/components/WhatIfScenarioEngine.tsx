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
import { MapPin, Plane, Clock, Fuel, DollarSign, AlertTriangle, TrendingUp, TrendingDown, Activity } from 'lucide-react';

interface FlightScenario {
  id: string;
  flightNumber: string;
  aircraft: string;
  route: string;
  originalFuel: number;
  originalTime: number;
  originalCost: number;
}

interface ScenarioModifications {
  weatherCondition: string;
  windSpeed: number;
  windDirection: number;
  routeOptimization: string;
  altitudeChange: number;
  speedAdjustment: number;
  diversionAirport?: string;
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
  const [modifications, setModifications] = useState<ScenarioModifications>({
    weatherCondition: 'current',
    windSpeed: 0,
    windDirection: 0,
    routeOptimization: 'standard',
    altitudeChange: 0,
    speedAdjustment: 0
  });
  const [results, setResults] = useState<ScenarioResults | null>(null);
  const [diversionOptions, setDiversionOptions] = useState<DiversionOption[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [realTimeComparison, setRealTimeComparison] = useState(false);

  useEffect(() => {
    fetchAvailableFlights();
  }, []);

  useEffect(() => {
    if (selectedFlight && realTimeComparison) {
      const interval = setInterval(calculateScenario, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedFlight, modifications, realTimeComparison]);

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
          originalFuel: flight.digital_twin_data?.performance_calculations?.fuel_flow_kg_per_hour * 6 || 50000,
          originalTime: flight.digital_twin_data?.performance_calculations?.total_flight_time_hours || 6.2,
          originalCost: flight.digital_twin_data?.performance_calculations?.operational_cost_usd || 44000
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
      // Simulate advanced scenario calculations
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const weatherImpact = getWeatherImpact(modifications.weatherCondition, modifications.windSpeed);
      const routeImpact = getRouteOptimizationImpact(modifications.routeOptimization);
      const altitudeImpact = getAltitudeImpact(modifications.altitudeChange);
      const speedImpact = getSpeedImpact(modifications.speedAdjustment);
      
      const fuelMultiplier = 1 + weatherImpact.fuel + routeImpact.fuel + altitudeImpact.fuel + speedImpact.fuel;
      const timeMultiplier = 1 + weatherImpact.time + routeImpact.time + altitudeImpact.time + speedImpact.time;
      const costMultiplier = 1 + weatherImpact.cost + routeImpact.cost + altitudeImpact.cost + speedImpact.cost;
      
      const newFuel = selectedFlight.originalFuel * fuelMultiplier;
      const newTime = selectedFlight.originalTime * timeMultiplier;
      const newCost = selectedFlight.originalCost * costMultiplier;
      
      const scenarioResults: ScenarioResults = {
        fuelBurn: {
          original: selectedFlight.originalFuel,
          modified: newFuel,
          difference: newFuel - selectedFlight.originalFuel,
          percentage: ((newFuel - selectedFlight.originalFuel) / selectedFlight.originalFuel) * 100
        },
        flightTime: {
          original: selectedFlight.originalTime,
          modified: newTime,
          difference: newTime - selectedFlight.originalTime,
          percentage: ((newTime - selectedFlight.originalTime) / selectedFlight.originalTime) * 100
        },
        operationalCost: {
          original: selectedFlight.originalCost,
          modified: newCost,
          difference: newCost - selectedFlight.originalCost,
          percentage: ((newCost - selectedFlight.originalCost) / selectedFlight.originalCost) * 100
        },
        riskFactors: assessRiskFactors(modifications),
        recommendations: generateRecommendations(modifications, {
          fuelDiff: newFuel - selectedFlight.originalFuel,
          timeDiff: newTime - selectedFlight.originalTime,
          costDiff: newCost - selectedFlight.originalCost
        })
      };
      
      setResults(scenarioResults);
      
      if (modifications.diversionAirport) {
        generateDiversionOptions();
      }
      
    } catch (error) {
      console.error('Scenario calculation failed:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const generateDiversionOptions = () => {
    const options: DiversionOption[] = [
      {
        icao: 'CYYZ',
        name: 'Toronto Pearson',
        distance: 1850,
        fuelRequired: 28500,
        weatherSuitability: 'excellent',
        runwayLength: 11120,
        virginAtlanticSupport: true,
        estimatedCost: 45000
      },
      {
        icao: 'KORD',
        name: 'Chicago O\'Hare',
        distance: 2100,
        fuelRequired: 32000,
        weatherSuitability: 'good',
        runwayLength: 13000,
        virginAtlanticSupport: false,
        estimatedCost: 67000
      },
      {
        icao: 'KJFK',
        name: 'New York JFK',
        distance: 2750,
        fuelRequired: 41000,
        weatherSuitability: 'good',
        runwayLength: 14511,
        virginAtlanticSupport: true,
        estimatedCost: 32000
      },
      {
        icao: 'KBOS',
        name: 'Boston Logan',
        distance: 2950,
        fuelRequired: 44000,
        weatherSuitability: 'poor',
        runwayLength: 10083,
        virginAtlanticSupport: true,
        estimatedCost: 38000
      }
    ];
    setDiversionOptions(options);
  };

  const getWeatherImpact = (condition: string, windSpeed: number) => {
    const impacts: Record<string, { fuel: number; time: number; cost: number }> = {
      'clear': { fuel: -0.02, time: -0.01, cost: -0.01 },
      'current': { fuel: 0, time: 0, cost: 0 },
      'cloudy': { fuel: 0.01, time: 0.005, cost: 0.005 },
      'rain': { fuel: 0.03, time: 0.02, cost: 0.02 },
      'storm': { fuel: 0.08, time: 0.06, cost: 0.05 },
      'severe': { fuel: 0.15, time: 0.12, cost: 0.1 }
    };
    
    const baseImpact = impacts[condition] || impacts['current'];
    const windImpact = Math.abs(windSpeed) * 0.001;
    
    return {
      fuel: baseImpact.fuel + windImpact,
      time: baseImpact.time + windImpact * 0.5,
      cost: baseImpact.cost + windImpact * 0.3
    };
  };

  const getRouteOptimizationImpact = (optimization: string) => {
    const impacts: Record<string, { fuel: number; time: number; cost: number }> = {
      'direct': { fuel: -0.05, time: -0.08, cost: -0.03 },
      'standard': { fuel: 0, time: 0, cost: 0 },
      'weather-avoid': { fuel: 0.02, time: 0.03, cost: 0.01 },
      'traffic-avoid': { fuel: 0.01, time: 0.05, cost: 0.02 }
    };
    return impacts[optimization] || impacts['standard'];
  };

  const getAltitudeImpact = (change: number) => {
    const impact = Math.abs(change) * 0.0001;
    return {
      fuel: change > 0 ? -impact * 0.5 : impact,
      time: change > 0 ? -impact * 0.3 : impact * 0.5,
      cost: impact * 0.2
    };
  };

  const getSpeedImpact = (adjustment: number) => {
    const impact = Math.abs(adjustment) * 0.002;
    return {
      fuel: adjustment > 0 ? impact * 1.5 : -impact * 0.5,
      time: adjustment > 0 ? -impact : impact,
      cost: adjustment > 0 ? impact : -impact * 0.3
    };
  };

  const assessRiskFactors = (mods: ScenarioModifications) => {
    const weatherRisk = mods.weatherCondition === 'severe' ? 'high' : 
                       mods.weatherCondition === 'storm' ? 'medium' : 'low';
    const fuelRisk = Math.abs(mods.speedAdjustment) > 15 ? 'high' : 'low';
    const timeRisk = mods.altitudeChange > 4000 ? 'medium' : 'low';
    const overallRisk = [weatherRisk, fuelRisk, timeRisk].includes('high') ? 'high' :
                       [weatherRisk, fuelRisk, timeRisk].includes('medium') ? 'medium' : 'low';
    
    return { weather: weatherRisk, fuel: fuelRisk, time: timeRisk, overall: overallRisk };
  };

  const generateRecommendations = (mods: ScenarioModifications, diffs: any) => {
    const recommendations = [];
    
    if (diffs.fuelDiff > 5000) {
      recommendations.push('Consider reducing cruise speed to optimize fuel consumption');
    }
    if (diffs.timeDiff > 0.5) {
      recommendations.push('Route optimization may help reduce flight time');
    }
    if (mods.weatherCondition === 'severe') {
      recommendations.push('Monitor weather closely and consider diversion if conditions worsen');
    }
    if (Math.abs(mods.altitudeChange) > 2000) {
      recommendations.push('Altitude change requires ATC coordination and fuel planning');
    }
    if (recommendations.length === 0) {
      recommendations.push('Current scenario parameters appear optimal');
    }
    
    return recommendations;
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'high': return 'text-red-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  const getPerformanceIcon = (percentage: number) => {
    if (percentage > 5) return <TrendingUp className="w-4 h-4 text-red-400" />;
    if (percentage < -5) return <TrendingDown className="w-4 h-4 text-green-400" />;
    return <Activity className="w-4 h-4 text-yellow-400" />;
  };

  return (
    <div className="w-full h-full bg-gray-900 text-white p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">What-If Scenario Engine</h1>
        <p className="text-gray-400">Advanced flight optimization and risk assessment modeling</p>
      </div>

      <Tabs defaultValue="scenario" className="w-full">
        <TabsList className="grid w-full grid-cols-4 bg-gray-800">
          <TabsTrigger value="scenario">Scenario Setup</TabsTrigger>
          <TabsTrigger value="results">Performance Analysis</TabsTrigger>
          <TabsTrigger value="diversions">Diversion Options</TabsTrigger>
          <TabsTrigger value="comparison">Real-time Comparison</TabsTrigger>
        </TabsList>

        <TabsContent value="scenario" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Flight Selection and Parameters */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Flight Selection & Parameters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-gray-300">Select Flight</Label>
                  <Select onValueChange={(value) => {
                    const flight = availableFlights.find(f => f.id === value);
                    setSelectedFlight(flight || null);
                  }}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue placeholder="Choose a flight to analyze" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-700 border-gray-600">
                      {availableFlights.map((flight) => (
                        <SelectItem key={flight.id} value={flight.id} className="text-white">
                          {flight.flightNumber} - {flight.route} ({flight.aircraft})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedFlight && (
                  <>
                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-700 rounded-lg">
                      <div className="text-center">
                        <Fuel className="w-5 h-5 text-blue-400 mx-auto mb-1" />
                        <div className="text-lg font-bold text-white">
                          {(selectedFlight.originalFuel / 1000).toFixed(1)}t
                        </div>
                        <div className="text-xs text-gray-400">Base Fuel</div>
                      </div>
                      <div className="text-center">
                        <Clock className="w-5 h-5 text-green-400 mx-auto mb-1" />
                        <div className="text-lg font-bold text-white">
                          {selectedFlight.originalTime.toFixed(1)}h
                        </div>
                        <div className="text-xs text-gray-400">Base Time</div>
                      </div>
                      <div className="text-center">
                        <DollarSign className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
                        <div className="text-lg font-bold text-white">
                          £{(selectedFlight.originalCost / 1000).toFixed(0)}k
                        </div>
                        <div className="text-xs text-gray-400">Base Cost</div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <Label className="text-gray-300">Weather Conditions</Label>
                        <Select value={modifications.weatherCondition} onValueChange={(value) =>
                          setModifications(prev => ({ ...prev, weatherCondition: value }))
                        }>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            <SelectItem value="clear" className="text-white">Clear Skies</SelectItem>
                            <SelectItem value="current" className="text-white">Current Conditions</SelectItem>
                            <SelectItem value="cloudy" className="text-white">Cloudy</SelectItem>
                            <SelectItem value="rain" className="text-white">Rain</SelectItem>
                            <SelectItem value="storm" className="text-white">Thunderstorms</SelectItem>
                            <SelectItem value="severe" className="text-white">Severe Weather</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-gray-300">Wind Speed (kts): {modifications.windSpeed}</Label>
                        <Slider
                          value={[modifications.windSpeed]}
                          onValueChange={(value) =>
                            setModifications(prev => ({ ...prev, windSpeed: value[0] }))
                          }
                          max={100}
                          min={-100}
                          step={5}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-gray-300">Route Optimization</Label>
                        <Select value={modifications.routeOptimization} onValueChange={(value) =>
                          setModifications(prev => ({ ...prev, routeOptimization: value }))
                        }>
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            <SelectItem value="direct" className="text-white">Direct Route</SelectItem>
                            <SelectItem value="standard" className="text-white">Standard Route</SelectItem>
                            <SelectItem value="weather-avoid" className="text-white">Weather Avoidance</SelectItem>
                            <SelectItem value="traffic-avoid" className="text-white">Traffic Avoidance</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label className="text-gray-300">Altitude Change (ft): {modifications.altitudeChange}</Label>
                        <Slider
                          value={[modifications.altitudeChange]}
                          onValueChange={(value) =>
                            setModifications(prev => ({ ...prev, altitudeChange: value[0] }))
                          }
                          max={6000}
                          min={-6000}
                          step={500}
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-gray-300">Speed Adjustment (kts): {modifications.speedAdjustment}</Label>
                        <Slider
                          value={[modifications.speedAdjustment]}
                          onValueChange={(value) =>
                            setModifications(prev => ({ ...prev, speedAdjustment: value[0] }))
                          }
                          max={30}
                          min={-30}
                          step={2}
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <Button
                      onClick={calculateScenario}
                      disabled={isCalculating}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {isCalculating ? 'Calculating...' : 'Calculate Scenario'}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Results Preview */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Quick Results</CardTitle>
              </CardHeader>
              <CardContent>
                {results ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-gray-700 rounded">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Fuel className="w-4 h-4 text-blue-400" />
                          {getPerformanceIcon(results.fuelBurn.percentage)}
                        </div>
                        <div className="text-lg font-bold text-white">
                          {results.fuelBurn.percentage > 0 ? '+' : ''}{results.fuelBurn.percentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">Fuel Change</div>
                      </div>
                      <div className="text-center p-3 bg-gray-700 rounded">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <Clock className="w-4 h-4 text-green-400" />
                          {getPerformanceIcon(results.flightTime.percentage)}
                        </div>
                        <div className="text-lg font-bold text-white">
                          {results.flightTime.percentage > 0 ? '+' : ''}{results.flightTime.percentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">Time Change</div>
                      </div>
                      <div className="text-center p-3 bg-gray-700 rounded">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <DollarSign className="w-4 h-4 text-yellow-400" />
                          {getPerformanceIcon(results.operationalCost.percentage)}
                        </div>
                        <div className="text-lg font-bold text-white">
                          {results.operationalCost.percentage > 0 ? '+' : ''}{results.operationalCost.percentage.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-400">Cost Change</div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-gray-300 font-medium mb-2">Risk Assessment</h4>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Weather:</span>
                          <span className={getRiskColor(results.riskFactors.weather)}>
                            {results.riskFactors.weather}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Fuel:</span>
                          <span className={getRiskColor(results.riskFactors.fuel)}>
                            {results.riskFactors.fuel}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Time:</span>
                          <span className={getRiskColor(results.riskFactors.time)}>
                            {results.riskFactors.time}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Overall:</span>
                          <span className={getRiskColor(results.riskFactors.overall)}>
                            {results.riskFactors.overall}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-gray-300 font-medium mb-2">Key Recommendations</h4>
                      <ul className="space-y-1">
                        {results.recommendations.slice(0, 3).map((rec, index) => (
                          <li key={index} className="text-sm text-gray-300 flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            {rec}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-400 py-8">
                    Configure scenario parameters and calculate to see results
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="mt-6">
          {results ? (
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Fuel className="w-5 h-5 text-blue-400" />
                    Fuel Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Original:</span>
                      <span className="text-white">{(results.fuelBurn.original / 1000).toFixed(1)}t</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Modified:</span>
                      <span className="text-white">{(results.fuelBurn.modified / 1000).toFixed(1)}t</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-300">Difference:</span>
                      <span className={results.fuelBurn.difference > 0 ? 'text-red-400' : 'text-green-400'}>
                        {results.fuelBurn.difference > 0 ? '+' : ''}{(results.fuelBurn.difference / 1000).toFixed(1)}t
                      </span>
                    </div>
                    <div className="text-center p-3 bg-gray-700 rounded">
                      <div className="text-2xl font-bold text-white">
                        {results.fuelBurn.percentage > 0 ? '+' : ''}{results.fuelBurn.percentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">Performance Change</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-green-400" />
                    Time Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Original:</span>
                      <span className="text-white">{results.flightTime.original.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Modified:</span>
                      <span className="text-white">{results.flightTime.modified.toFixed(1)}h</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-300">Difference:</span>
                      <span className={results.flightTime.difference > 0 ? 'text-red-400' : 'text-green-400'}>
                        {results.flightTime.difference > 0 ? '+' : ''}{(results.flightTime.difference * 60).toFixed(0)}min
                      </span>
                    </div>
                    <div className="text-center p-3 bg-gray-700 rounded">
                      <div className="text-2xl font-bold text-white">
                        {results.flightTime.percentage > 0 ? '+' : ''}{results.flightTime.percentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">Performance Change</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <DollarSign className="w-5 h-5 text-yellow-400" />
                    Cost Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Original:</span>
                      <span className="text-white">£{(results.operationalCost.original / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Modified:</span>
                      <span className="text-white">£{(results.operationalCost.modified / 1000).toFixed(0)}k</span>
                    </div>
                    <div className="flex justify-between font-bold">
                      <span className="text-gray-300">Difference:</span>
                      <span className={results.operationalCost.difference > 0 ? 'text-red-400' : 'text-green-400'}>
                        {results.operationalCost.difference > 0 ? '+' : ''}£{(results.operationalCost.difference / 1000).toFixed(0)}k
                      </span>
                    </div>
                    <div className="text-center p-3 bg-gray-700 rounded">
                      <div className="text-2xl font-bold text-white">
                        {results.operationalCost.percentage > 0 ? '+' : ''}{results.operationalCost.percentage.toFixed(1)}%
                      </div>
                      <div className="text-xs text-gray-400">Performance Change</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="py-8">
                <div className="text-center text-gray-400">
                  Run a scenario calculation to see detailed performance analysis
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="diversions" className="mt-6">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <div>
              <Button
                onClick={generateDiversionOptions}
                className="mb-4 bg-purple-600 hover:bg-purple-700"
              >
                Generate Diversion Options
              </Button>
              
              {diversionOptions.map((option) => (
                <Card key={option.icao} className="bg-gray-800 border-gray-700 mb-4">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-white">{option.name} ({option.icao})</CardTitle>
                      <Badge className={
                        option.weatherSuitability === 'excellent' ? 'bg-green-600' :
                        option.weatherSuitability === 'good' ? 'bg-yellow-600' : 'bg-red-600'
                      }>
                        {option.weatherSuitability}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <span className="text-gray-400 text-sm">Distance:</span>
                        <p className="text-white">{option.distance} nm</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Fuel Required:</span>
                        <p className="text-white">{(option.fuelRequired / 1000).toFixed(1)}t</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">Runway:</span>
                        <p className="text-white">{option.runwayLength.toLocaleString()}ft</p>
                      </div>
                      <div>
                        <span className="text-gray-400 text-sm">VS Support:</span>
                        <p className={option.virginAtlanticSupport ? 'text-green-400' : 'text-red-400'}>
                          {option.virginAtlanticSupport ? 'Available' : 'Limited'}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <span className="text-gray-400 text-sm">Estimated Cost:</span>
                        <p className="text-white text-lg font-bold">£{option.estimatedCost.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="mt-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Real-time Performance Comparison</CardTitle>
                <div className="flex items-center gap-2">
                  <Label className="text-gray-300">Auto-refresh</Label>
                  <Switch
                    checked={realTimeComparison}
                    onCheckedChange={setRealTimeComparison}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-400 py-8">
                Real-time comparison will track actual vs. predicted performance metrics
                {realTimeComparison && selectedFlight && (
                  <div className="mt-4 text-blue-400">
                    Monitoring {selectedFlight.flightNumber} - Updates every 30 seconds
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}