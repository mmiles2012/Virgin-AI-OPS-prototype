/**
 * Standardized Digital Twin Component for AINO Aviation Intelligence Platform
 * Universal display component for both Boeing and Airbus aircraft digital twins
 * Supports: Predictions, Operations Centers, Diversion Engines, What-if Scenarios
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Progress } from './ui/progress';
import { AlertTriangle, Plane, Fuel, Clock, MapPin, Settings, TrendingUp } from 'lucide-react';

interface StandardizedDigitalTwinProps {
  aircraftId: string;
  displayMode?: 'full' | 'operations' | 'diversion' | 'whatif' | 'predictions';
}

interface DigitalTwinData {
  identity: {
    aircraftType: string;
    manufacturer: 'Boeing' | 'Airbus';
    series: string;
    variant: string;
    tailNumber: string;
    fleetId: string;
  };
  currentState: {
    timestamp: string;
    location: {
      latitude: number;
      longitude: number;
      altitude: number;
      groundSpeed: number;
      heading: number;
      verticalSpeed: number;
    };
    engines: {
      count: number;
      thrustPercentage: number;
      fuelFlowRate: number;
      temperature: number;
      status: string;
      efficiency: number;
    };
    fuel: {
      totalRemaining: number;
      totalCapacity: number;
      remainingPercentage: number;
      consumption: number;
      efficiency: number;
      endurance: number;
    };
  };
  predictions: {
    delayRisk: {
      probability: number;
      expectedDelay: number;
      confidence: number;
      factors: string[];
    };
    fuelPrediction: {
      arrivalFuelKg: number;
      contingencyFuelKg: number;
      diversionCapability: boolean;
      alternateAirports: string[];
    };
    performanceTrend: {
      efficiency: string;
      maintenanceAlert: boolean;
      nextServiceHours: number;
      healthScore: number;
    };
  };
  operationsData: {
    flightPlan: {
      route: string;
      departureTime: string;
      arrivalTime: string;
      flightTime: number;
      distance: number;
      plannedAltitude: number;
    };
    passengers: {
      total: number;
      checkedIn: number;
      connecting: number;
      specialServices: number;
    };
  };
  diversionCapabilities: {
    currentRange: number;
    suitableAirports: Array<{
      icao: string;
      name: string;
      distance: number;
      suitability: string;
      runwayLength: number;
      fuelAvailable: boolean;
      maintenanceCapable: boolean;
    }>;
  };
  scenarioCapabilities: {
    routeAlternatives: Array<{
      route: string;
      addedTime: number;
      addedFuel: number;
      addedCost: number;
      feasible: boolean;
    }>;
    speedAdjustments: {
      minSpeed: number;
      maxSpeed: number;
      economySpeed: number;
      timeSpeed: number;
    };
  };
  economics: {
    operationalCost: {
      perHour: number;
      perNauticalMile: number;
      perPassenger: number;
      total: number;
    };
    fuelCost: {
      consumed: number;
      remaining: number;
      efficiency: number;
    };
  };
  mlPredictions: {
    delayProbability: number;
    delayMinutes: number;
    fuelEfficiency: number;
    confidence: number;
    lastUpdated: string;
  };
  alerts: Array<{
    id: string;
    type: string;
    priority: string;
    message: string;
    timestamp: string;
    acknowledged: boolean;
  }>;
}

export default function StandardizedDigitalTwin({ 
  aircraftId, 
  displayMode = 'full' 
}: StandardizedDigitalTwinProps) {
  const [digitalTwinData, setDigitalTwinData] = useState<DigitalTwinData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchDigitalTwinData();
    const interval = setInterval(fetchDigitalTwinData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, [aircraftId, displayMode]);

  const fetchDigitalTwinData = async () => {
    try {
      const response = await fetch(`/api/aviation/digital-twin/${aircraftId}?format=${displayMode}`);
      const data = await response.json();
      
      if (data.success) {
        setDigitalTwinData(data.digitalTwin);
        setError(null);
      } else {
        setError(data.error || 'Failed to fetch digital twin data');
      }
    } catch (err) {
      setError('Network error fetching digital twin data');
      console.error('Digital twin fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status.toLowerCase()) {
      case 'normal': case 'excellent': case 'good': return 'text-green-600';
      case 'caution': case 'degraded': case 'adequate': return 'text-yellow-600';
      case 'warning': case 'poor': return 'text-orange-600';
      case 'critical': case 'emergency': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getPriorityColor = (priority: string): string => {
    switch (priority.toLowerCase()) {
      case 'low': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'critical': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading digital twin data...</p>
        </div>
      </div>
    );
  }

  if (error || !digitalTwinData) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <AlertTriangle className="h-5 w-5 text-red-600 mr-3" />
          <div>
            <h3 className="text-red-800 font-medium">Digital Twin Error</h3>
            <p className="text-red-600 mt-1">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Aircraft Identity Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Plane className="h-6 w-6 text-blue-600" />
              <div>
                <h2 className="text-xl font-bold">
                  {digitalTwinData.identity.aircraftType}
                </h2>
                <p className="text-sm text-gray-600">
                  {digitalTwinData.identity.tailNumber} • {digitalTwinData.identity.fleetId}
                </p>
              </div>
            </div>
            <Badge 
              variant="outline" 
              className={`px-3 py-1 ${
                digitalTwinData.identity.manufacturer === 'Boeing' 
                  ? 'border-blue-500 text-blue-700 bg-blue-50' 
                  : 'border-purple-500 text-purple-700 bg-purple-50'
              }`}
            >
              {digitalTwinData.identity.manufacturer} {digitalTwinData.identity.variant}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <div className="text-sm font-medium">{digitalTwinData.currentState.location.altitude.toLocaleString()} ft</div>
              <div className="text-xs text-gray-600">Altitude</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <div className="text-sm font-medium">{digitalTwinData.currentState.location.groundSpeed} kts</div>
              <div className="text-xs text-gray-600">Ground Speed</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Fuel className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <div className="text-sm font-medium">{digitalTwinData.currentState.fuel.remainingPercentage.toFixed(1)}%</div>
              <div className="text-xs text-gray-600">Fuel Remaining</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Settings className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <div className={`text-sm font-medium ${getStatusColor(digitalTwinData.currentState.engines.status)}`}>
                {digitalTwinData.currentState.engines.status}
              </div>
              <div className="text-xs text-gray-600">Engine Status</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
          <TabsTrigger value="operations">Operations</TabsTrigger>
          <TabsTrigger value="diversion">Diversion</TabsTrigger>
          <TabsTrigger value="whatif">What-If</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          {/* Current Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Current Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Engine Performance</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Thrust:</span>
                      <span className="font-medium">{digitalTwinData.currentState.engines.thrustPercentage.toFixed(1)}%</span>
                    </div>
                    <Progress value={digitalTwinData.currentState.engines.thrustPercentage} className="h-2" />
                    
                    <div className="flex justify-between">
                      <span className="text-sm">Efficiency:</span>
                      <span className="font-medium">{digitalTwinData.currentState.engines.efficiency.toFixed(1)}%</span>
                    </div>
                    <Progress value={digitalTwinData.currentState.engines.efficiency} className="h-2" />
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Fuel Management</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm">Remaining:</span>
                      <span className="font-medium">{digitalTwinData.currentState.fuel.totalRemaining.toLocaleString()} kg</span>
                    </div>
                    <Progress value={digitalTwinData.currentState.fuel.remainingPercentage} className="h-2" />
                    
                    <div className="flex justify-between">
                      <span className="text-sm">Endurance:</span>
                      <span className="font-medium">{digitalTwinData.currentState.fuel.endurance.toFixed(1)} hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Alerts */}
          {digitalTwinData.alerts.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {digitalTwinData.alerts.map((alert) => (
                    <div key={alert.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <div>
                          <p className="text-sm font-medium">{alert.message}</p>
                          <p className="text-xs text-gray-600">{alert.type}</p>
                        </div>
                      </div>
                      <Badge className={getPriorityColor(alert.priority)}>
                        {alert.priority}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="predictions" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Delay Risk Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span>Delay Probability</span>
                      <span className="font-medium">{(digitalTwinData.predictions.delayRisk.probability * 100).toFixed(1)}%</span>
                    </div>
                    <Progress value={digitalTwinData.predictions.delayRisk.probability * 100} className="h-2" />
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-600">Expected Delay: </span>
                    <span className="font-medium">{digitalTwinData.predictions.delayRisk.expectedDelay} minutes</span>
                  </div>
                  
                  <div>
                    <span className="text-sm text-gray-600">Confidence: </span>
                    <span className="font-medium">{(digitalTwinData.predictions.delayRisk.confidence * 100).toFixed(1)}%</span>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Contributing Factors:</h5>
                    <ul className="text-sm space-y-1">
                      {digitalTwinData.predictions.delayRisk.factors.map((factor, index) => (
                        <li key={index} className="text-gray-600">• {factor}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fuel Predictions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Arrival Fuel:</span>
                    <span className="font-medium">{digitalTwinData.predictions.fuelPrediction.arrivalFuelKg.toLocaleString()} kg</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Contingency:</span>
                    <span className="font-medium">{digitalTwinData.predictions.fuelPrediction.contingencyFuelKg.toLocaleString()} kg</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Diversion Capable:</span>
                    <Badge variant={digitalTwinData.predictions.fuelPrediction.diversionCapability ? "default" : "destructive"}>
                      {digitalTwinData.predictions.fuelPrediction.diversionCapability ? "Yes" : "No"}
                    </Badge>
                  </div>
                  
                  <div>
                    <h5 className="font-medium mb-2">Alternate Airports:</h5>
                    <div className="flex flex-wrap gap-1">
                      {digitalTwinData.predictions.fuelPrediction.alternateAirports.map((airport) => (
                        <Badge key={airport} variant="outline" className="text-xs">
                          {airport}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="operations" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Flight Plan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Route:</span>
                    <span className="font-medium">{digitalTwinData.operationsData.flightPlan.route}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Distance:</span>
                    <span className="font-medium">{digitalTwinData.operationsData.flightPlan.distance.toLocaleString()} nm</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Flight Time:</span>
                    <span className="font-medium">{Math.floor(digitalTwinData.operationsData.flightPlan.flightTime / 60)}h {digitalTwinData.operationsData.flightPlan.flightTime % 60}m</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Planned Altitude:</span>
                    <span className="font-medium">{digitalTwinData.operationsData.flightPlan.plannedAltitude.toLocaleString()} ft</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Passenger Load</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Total Passengers:</span>
                    <span className="font-medium">{digitalTwinData.operationsData.passengers.total}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Checked In:</span>
                    <span className="font-medium">{digitalTwinData.operationsData.passengers.checkedIn}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Connecting:</span>
                    <span className="font-medium">{digitalTwinData.operationsData.passengers.connecting}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Special Services:</span>
                    <span className="font-medium">{digitalTwinData.operationsData.passengers.specialServices}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="diversion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Diversion Capabilities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">Current Range:</span>
                  <span className="font-medium">{digitalTwinData.diversionCapabilities.currentRange.toLocaleString()} nm</span>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Suitable Airports</h4>
                  <div className="space-y-2">
                    {digitalTwinData.diversionCapabilities.suitableAirports.map((airport) => (
                      <div key={airport.icao} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{airport.icao} - {airport.name}</p>
                          <p className="text-sm text-gray-600">
                            {airport.distance} nm • Runway: {airport.runwayLength.toLocaleString()} ft
                          </p>
                        </div>
                        <div className="text-right">
                          <Badge 
                            variant="outline" 
                            className={
                              airport.suitability === 'EXCELLENT' ? 'border-green-500 text-green-700' :
                              airport.suitability === 'GOOD' ? 'border-blue-500 text-blue-700' :
                              'border-yellow-500 text-yellow-700'
                            }
                          >
                            {airport.suitability}
                          </Badge>
                          <div className="text-xs text-gray-600 mt-1">
                            {airport.fuelAvailable && 'Fuel • '}
                            {airport.maintenanceCapable && 'Maintenance'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whatif" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Route Alternatives</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {digitalTwinData.scenarioCapabilities.routeAlternatives.map((route, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{route.route}</p>
                          <p className="text-sm text-gray-600">
                            +{route.addedTime} min • +{route.addedFuel} kg • +${route.addedCost}
                          </p>
                        </div>
                        <Badge variant={route.feasible ? "default" : "destructive"}>
                          {route.feasible ? "Feasible" : "Not Feasible"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Speed Adjustments</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-sm">Economy Speed:</span>
                    <span className="font-medium">{digitalTwinData.scenarioCapabilities.speedAdjustments.economySpeed} kts</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Time Speed:</span>
                    <span className="font-medium">{digitalTwinData.scenarioCapabilities.speedAdjustments.timeSpeed} kts</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-sm">Speed Range:</span>
                    <span className="font-medium">
                      {digitalTwinData.scenarioCapabilities.speedAdjustments.minSpeed} - {digitalTwinData.scenarioCapabilities.speedAdjustments.maxSpeed} kts
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Economics Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Economic Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Clock className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <div className="text-sm font-medium">${digitalTwinData.economics.operationalCost.perHour.toLocaleString()}</div>
              <div className="text-xs text-gray-600">Per Hour</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <MapPin className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <div className="text-sm font-medium">${digitalTwinData.economics.operationalCost.perNauticalMile.toFixed(0)}</div>
              <div className="text-xs text-gray-600">Per Nautical Mile</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Plane className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <div className="text-sm font-medium">${digitalTwinData.economics.operationalCost.perPassenger.toFixed(0)}</div>
              <div className="text-xs text-gray-600">Per Passenger</div>
            </div>
            <div className="text-center p-3 bg-gray-50 rounded-lg">
              <Fuel className="h-5 w-5 text-gray-600 mx-auto mb-1" />
              <div className="text-sm font-medium">${digitalTwinData.economics.fuelCost.efficiency.toFixed(2)}</div>
              <div className="text-xs text-gray-600">Fuel Efficiency</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}