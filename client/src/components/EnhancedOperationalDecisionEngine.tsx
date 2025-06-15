import React, { useState, useEffect } from 'react';
import { AlertTriangle, Clock, DollarSign, Users, Plane, MapPin, TrendingUp, Brain, Gauge, Zap, Shield, Wind, Eye, Fuel, Building, Wrench, FileText, BarChart3, CheckCircle } from 'lucide-react';
import { useSelectedFlight } from '../lib/stores/useSelectedFlight';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';

interface EnhancedFlightData {
  callsign: string;
  aircraft: string;
  route: string;
  currentPosition: { lat: number; lon: number };
  altitude: number;
  speed: number;
  fuelRemaining: number;
  fuelBurn: number;
  maximumRange: number;
  currentWeight: number;
  passengers: number;
  eta: string;
}

const ActiveFlightsList = () => {
  const { selectedFlight, setSelectedFlight } = useSelectedFlight();
  
  const fallbackFlights = [
    { 
      callsign: 'VIR127C', 
      aircraft: 'A350-1000', 
      route: 'LHR-JFK',
      status: 'Featured',
      emergency: 'Medical Emergency',
      position: '45.18°N, 69.17°W'
    },
    { 
      callsign: 'BAW189', 
      aircraft: 'A380-800', 
      route: 'LHR-LAX',
      status: 'Active',
      position: '51.4°N, 12.2°W'
    },
    { 
      callsign: 'VS43', 
      aircraft: 'A330-300', 
      route: 'LGW-MCO',
      status: 'Active',
      position: '40.2°N, 45.8°W'
    }
  ];

  return (
    <Card className="bg-gray-800/50 border-gray-600 h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Plane className="h-5 w-5 text-blue-400" />
          Active Flights
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {fallbackFlights.map((flight) => (
          <div
            key={flight.callsign}
            onClick={() => setSelectedFlight(flight.callsign)}
            className={`p-3 rounded-lg cursor-pointer transition-all border ${
              selectedFlight === flight.callsign
                ? 'bg-blue-600/30 border-blue-400 shadow-lg'
                : 'bg-gray-700/50 border-gray-600 hover:bg-gray-700/70'
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-white font-semibold">{flight.callsign}</span>
              {flight.status === 'Featured' && (
                <Badge className="bg-red-600 text-white text-xs">Featured</Badge>
              )}
            </div>
            <div className="text-sm text-gray-400">{flight.aircraft}</div>
            <div className="text-sm text-gray-400">{flight.route}</div>
            <div className="text-xs text-gray-500 mt-1">{flight.position}</div>
            {flight.emergency && (
              <div className="text-xs text-red-400 mt-1">{flight.emergency}</div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default function EnhancedOperationalDecisionEngine() {
  const { selectedFlight } = useSelectedFlight();
  
  const flightData: EnhancedFlightData | null = selectedFlight ? {
    callsign: selectedFlight,
    aircraft: selectedFlight === 'VIR127C' ? 'A350-1000' : 'A380-800',
    route: selectedFlight === 'VIR127C' ? 'LHR-JFK' : 'LHR-LAX',
    currentPosition: { lat: 45.18, lon: -69.17 },
    altitude: 40000,
    speed: 457,
    fuelRemaining: 42000,
    fuelBurn: 2400,
    maximumRange: 8000,
    currentWeight: 280000,
    passengers: selectedFlight === 'VIR127C' ? 298 : 450,
    eta: '14:30 UTC'
  } : null;

  return (
    <div className="h-full bg-gradient-to-br from-blue-900/20 via-gray-900 to-gray-800 text-white">
      <div className="flex h-full gap-4 p-4">
        {/* Left Sidebar */}
        <div className="w-64 flex-shrink-0">
          <ActiveFlightsList />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 space-y-6">
          {!flightData ? (
            <Card className="bg-gray-800/50 border-gray-600">
              <CardContent className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Plane className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">Select a Flight</h3>
                  <p className="text-gray-400">Choose a flight from the sidebar to begin operational decision analysis</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Flight Overview Card */}
              <Card className="bg-gray-900/80 border-gray-500 shadow-lg">
                <CardHeader className="pb-3">
                  <CardTitle className="text-white flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Brain className="h-6 w-6 text-blue-400" />
                      <span className="text-xl">Flight {flightData?.callsign}</span>
                    </div>
                    {flightData?.callsign === 'VIR127C' && (
                      <Badge className="bg-red-600 text-white px-3 py-1 animate-pulse">MEDICAL EMERGENCY</Badge>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-6">
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-gray-400 text-xs uppercase tracking-wide">Aircraft</div>
                      <div className="text-white font-semibold text-lg">{flightData?.aircraft}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-gray-400 text-xs uppercase tracking-wide">Route</div>
                      <div className="text-white font-semibold text-lg">{flightData?.route}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-gray-400 text-xs uppercase tracking-wide">Fuel Remaining</div>
                      <div className="text-white font-semibold text-lg">{flightData?.fuelRemaining.toLocaleString()} kg</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-3">
                      <div className="text-gray-400 text-xs uppercase tracking-wide">Passengers</div>
                      <div className="text-white font-semibold text-lg">{flightData?.passengers}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Tabs defaultValue="simulation" className="space-y-6">
                <TabsList className="grid w-full grid-cols-5 bg-gray-800/50 p-1 rounded-lg">
                  <TabsTrigger value="simulation" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Gauge className="h-4 w-4 mr-2" />
                    Diversion
                  </TabsTrigger>
                  <TabsTrigger value="airfields" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Building className="h-4 w-4 mr-2" />
                    Airfields
                  </TabsTrigger>
                  <TabsTrigger value="analysis" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Costs
                  </TabsTrigger>
                  <TabsTrigger value="crew" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <Users className="h-4 w-4 mr-2" />
                    Crew
                  </TabsTrigger>
                  <TabsTrigger value="reports" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    <FileText className="h-4 w-4 mr-2" />
                    Reports
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="simulation" className="space-y-4">
                  {/* VIR127C Specific Diversion Comparison */}
                  {flightData?.callsign === 'VIR127C' && (
                    <Card className="bg-red-900/20 border-red-500 shadow-lg mb-6">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-red-300 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <AlertTriangle className="h-6 w-6" />
                            <span className="text-lg">Medical Emergency - Diversion Analysis</span>
                          </div>
                          <Badge className="bg-red-600 text-white animate-pulse">URGENT</Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="bg-gray-800/50 rounded-lg p-4 mb-6 border border-gray-600">
                          <div className="grid grid-cols-5 gap-4 text-center">
                            <div>
                              <div className="text-gray-400 text-xs uppercase">Position</div>
                              <div className="text-white font-semibold">45.18°N, 69.17°W</div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs uppercase">Altitude</div>
                              <div className="text-white font-semibold">40,000ft</div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs uppercase">Speed</div>
                              <div className="text-white font-semibold">457kt</div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs uppercase">Fuel</div>
                              <div className="text-white font-semibold">42,000kg</div>
                            </div>
                            <div>
                              <div className="text-gray-400 text-xs uppercase">Crew Duty</div>
                              <div className="text-yellow-400 font-semibold">187min left</div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                          {/* Gander Option */}
                          <div className="bg-gray-800/60 border border-gray-500 rounded-lg p-5 shadow-md">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-yellow-600/20 p-2 rounded-lg">
                                  <MapPin className="h-5 w-5 text-yellow-400" />
                                </div>
                                <div>
                                  <h3 className="text-white font-semibold text-lg">Gander</h3>
                                  <p className="text-gray-400 text-sm">CYQX</p>
                                </div>
                              </div>
                              <Badge className="bg-yellow-600 text-white px-3 py-1 text-sm">Score: 78</Badge>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div className="text-center bg-gray-700/50 p-3 rounded">
                                <div className="text-gray-400 text-xs uppercase">Distance</div>
                                <div className="text-white font-semibold">234 km</div>
                              </div>
                              <div className="text-center bg-gray-700/50 p-3 rounded">
                                <div className="text-gray-400 text-xs uppercase">Flight Time</div>
                                <div className="text-white font-semibold">17 min</div>
                              </div>
                              <div className="text-center bg-gray-700/50 p-3 rounded">
                                <div className="text-gray-400 text-xs uppercase">Fuel Required</div>
                                <div className="text-white font-semibold">1,850 kg</div>
                              </div>
                            </div>
                            
                            <div className="bg-gray-700/30 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <DollarSign className="h-4 w-4 text-green-400" />
                                <span className="text-gray-300 font-medium">Cost Analysis</span>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Passenger Care:</span>
                                  <span className="text-white font-medium">$89,400</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Crew Costs:</span>
                                  <span className="text-white font-medium">$8,200</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Aircraft Costs:</span>
                                  <span className="text-white font-medium">$12,850</span>
                                </div>
                                <div className="border-t border-gray-600 pt-2 mt-3">
                                  <div className="flex justify-between text-lg font-semibold">
                                    <span className="text-green-400">Total Cost:</span>
                                    <span className="text-green-400">$110,450</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Halifax Option */}
                          <div className="bg-gray-800/60 border border-gray-500 rounded-lg p-5 shadow-md">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-600/20 p-2 rounded-lg">
                                  <MapPin className="h-5 w-5 text-blue-400" />
                                </div>
                                <div>
                                  <h3 className="text-white font-semibold text-lg">Halifax</h3>
                                  <p className="text-gray-400 text-sm">CYHZ</p>
                                </div>
                              </div>
                              <Badge className="bg-blue-600 text-white px-3 py-1 text-sm">Score: 85</Badge>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 mb-4">
                              <div className="text-center bg-gray-700/50 p-3 rounded">
                                <div className="text-gray-400 text-xs uppercase">Distance</div>
                                <div className="text-white font-semibold">312 km</div>
                              </div>
                              <div className="text-center bg-gray-700/50 p-3 rounded">
                                <div className="text-gray-400 text-xs uppercase">Flight Time</div>
                                <div className="text-white font-semibold">23 min</div>
                              </div>
                              <div className="text-center bg-gray-700/50 p-3 rounded">
                                <div className="text-gray-400 text-xs uppercase">Fuel Required</div>
                                <div className="text-white font-semibold">2,400 kg</div>
                              </div>
                            </div>
                            
                            <div className="bg-gray-700/30 rounded-lg p-4">
                              <div className="flex items-center gap-2 mb-3">
                                <DollarSign className="h-4 w-4 text-blue-400" />
                                <span className="text-gray-300 font-medium">Cost Analysis</span>
                              </div>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Passenger Care:</span>
                                  <span className="text-white font-medium">$95,200</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Crew Costs:</span>
                                  <span className="text-white font-medium">$9,600</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-400">Aircraft Costs:</span>
                                  <span className="text-white font-medium">$17,800</span>
                                </div>
                                <div className="border-t border-gray-600 pt-2 mt-3">
                                  <div className="flex justify-between text-lg font-semibold">
                                    <span className="text-blue-400">Total Cost:</span>
                                    <span className="text-blue-400">$122,600</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="mt-6 bg-green-900/20 border border-green-500 rounded-lg p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <CheckCircle className="h-5 w-5 text-green-400" />
                            <span className="text-green-300 font-semibold">AI Recommendation</span>
                          </div>
                          <p className="text-gray-300 text-sm">
                            <strong className="text-green-400">Recommend Gander (CYQX)</strong> - Lower cost option with adequate medical facilities. 
                            Save $12,150 compared to Halifax while maintaining safety standards.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Generic Diversion Analysis for other flights */}
                  {flightData?.callsign !== 'VIR127C' && (
                    <Card className="bg-gray-800/50 border-gray-600">
                      <CardHeader>
                        <CardTitle className="text-white flex items-center gap-2">
                          <Gauge className="h-5 w-5" />
                          Diversion Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-gray-300">
                          Diversion analysis and operational recommendations for flight {flightData?.callsign}.
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="airfields" className="space-y-4">
                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        Available Airfields
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-gray-300">
                        Analysis of suitable diversion airports based on current position, fuel, and operational requirements.
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4">
                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Cost Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-gray-300">
                        Comprehensive cost analysis including fuel, crew, passenger care, and operational expenses.
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="crew" className="space-y-4">
                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Crew Management
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-gray-300">
                        Crew duty time analysis, fatigue management, and regulatory compliance monitoring.
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Reports & Documentation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-gray-300">
                        Automated report generation and operational documentation for regulatory compliance.
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}