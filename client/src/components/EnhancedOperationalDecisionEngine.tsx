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
              selectedFlight?.callsign === flight.callsign
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
    callsign: selectedFlight.callsign,
    aircraft: selectedFlight.callsign === 'VIR127C' ? 'A350-1000' : 'A380-800',
    route: selectedFlight.callsign === 'VIR127C' ? 'LHR-JFK' : 'LHR-LAX',
    currentPosition: { lat: selectedFlight.latitude, lon: selectedFlight.longitude },
    altitude: selectedFlight.altitude,
    speed: selectedFlight.velocity,
    fuelRemaining: 42000,
    fuelBurn: 2400,
    maximumRange: 8000,
    currentWeight: 280000,
    passengers: selectedFlight.callsign === 'VIR127C' ? 298 : 450,
    eta: '14:30 UTC'
  } : null;

  return (
    <div className="h-full bg-gradient-to-br from-blue-900/20 via-gray-900 to-gray-800 text-white overflow-hidden">
      <div className="flex h-full gap-4 p-4">
        {/* Left Sidebar */}
        <div className="w-64 flex-shrink-0 overflow-y-auto">
          <ActiveFlightsList />
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto">
          <div className="space-y-6 pb-6">
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
                        Available Diversion Airports
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {/* Primary Options */}
                        <div className="grid gap-4">
                          <div className="bg-gray-700/50 rounded-lg p-4 border border-green-500/30">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="bg-green-600/20 p-2 rounded">
                                  <Building className="h-4 w-4 text-green-400" />
                                </div>
                                <div>
                                  <h3 className="text-white font-semibold">Gander International (CYQX)</h3>
                                  <p className="text-gray-400 text-sm">Newfoundland, Canada</p>
                                </div>
                              </div>
                              <Badge className="bg-green-600 text-white">RECOMMENDED</Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Distance:</span>
                                <div className="text-white font-medium">234 km</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Runway:</span>
                                <div className="text-white font-medium">03/21 3048m</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Medical:</span>
                                <div className="text-green-400 font-medium">Level 2 Trauma</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Weather:</span>
                                <div className="text-white font-medium">VIS 10km</div>
                              </div>
                            </div>
                          </div>

                          <div className="bg-gray-700/50 rounded-lg p-4 border border-blue-500/30">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="bg-blue-600/20 p-2 rounded">
                                  <Building className="h-4 w-4 text-blue-400" />
                                </div>
                                <div>
                                  <h3 className="text-white font-semibold">Halifax Stanfield (CYHZ)</h3>
                                  <p className="text-gray-400 text-sm">Nova Scotia, Canada</p>
                                </div>
                              </div>
                              <Badge className="bg-blue-600 text-white">ALTERNATIVE</Badge>
                            </div>
                            <div className="grid grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="text-gray-400">Distance:</span>
                                <div className="text-white font-medium">312 km</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Runway:</span>
                                <div className="text-white font-medium">05/23 3200m</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Medical:</span>
                                <div className="text-blue-400 font-medium">Level 1 Trauma</div>
                              </div>
                              <div>
                                <span className="text-gray-400">Weather:</span>
                                <div className="text-white font-medium">VIS 15km</div>
                              </div>
                            </div>
                          </div>

                          {/* Secondary Options */}
                          <div className="bg-gray-700/30 rounded-lg p-4 border border-gray-600">
                            <h4 className="text-gray-300 font-medium mb-3">Secondary Options</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex justify-between items-center py-2 border-b border-gray-600">
                                <div>
                                  <span className="text-white">St. John's (CYYT)</span>
                                  <span className="text-gray-400 ml-2">- 425 km</span>
                                </div>
                                <span className="text-yellow-400">Fuel Limited</span>
                              </div>
                              <div className="flex justify-between items-center py-2 border-b border-gray-600">
                                <div>
                                  <span className="text-white">Sydney (CYQY)</span>
                                  <span className="text-gray-400 ml-2">- 287 km</span>
                                </div>
                                <span className="text-gray-400">Available</span>
                              </div>
                              <div className="flex justify-between items-center py-2">
                                <div>
                                  <span className="text-white">Moncton (CYQM)</span>
                                  <span className="text-gray-400 ml-2">- 398 km</span>
                                </div>
                                <span className="text-gray-400">Available</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="analysis" className="space-y-4">
                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <DollarSign className="h-5 w-5" />
                        Financial Impact Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Cost Comparison Summary */}
                        <div className="bg-gray-700/30 rounded-lg p-4">
                          <h3 className="text-white font-semibold mb-4">Diversion Cost Comparison</h3>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-green-900/30 border border-green-500/50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-green-300 font-medium">Gander (CYQX)</span>
                                <span className="text-green-400 font-bold text-xl">$110,450</span>
                              </div>
                              <div className="text-sm text-gray-300">Cost savings: $12,150</div>
                            </div>
                            <div className="bg-blue-900/30 border border-blue-500/50 rounded-lg p-4">
                              <div className="flex items-center justify-between mb-2">
                                <span className="text-blue-300 font-medium">Halifax (CYHZ)</span>
                                <span className="text-blue-400 font-bold text-xl">$122,600</span>
                              </div>
                              <div className="text-sm text-gray-300">Higher medical capabilities</div>
                            </div>
                          </div>
                        </div>

                        {/* Detailed Cost Breakdown */}
                        <div className="grid md:grid-cols-2 gap-6">
                          <Card className="bg-gray-700/50 border-gray-600">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-green-300 text-lg">Gander - Cost Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="flex justify-between border-b border-gray-600 pb-2">
                                  <span className="text-gray-400">Passenger Care (298 pax)</span>
                                  <span className="text-white font-medium">$89,400</span>
                                </div>
                                <div className="text-xs text-gray-500 -mt-2 mb-2">
                                  • Hotel accommodation: $200/night × 298 = $59,600<br/>
                                  • Meals & transport: $100/pax = $29,800
                                </div>

                                <div className="flex justify-between border-b border-gray-600 pb-2">
                                  <span className="text-gray-400">Crew Costs</span>
                                  <span className="text-white font-medium">$8,200</span>
                                </div>
                                <div className="text-xs text-gray-500 -mt-2 mb-2">
                                  • Flight crew duty extension: $3,200<br/>
                                  • Cabin crew overtime: $2,400<br/>
                                  • Accommodation: $2,600
                                </div>

                                <div className="flex justify-between border-b border-gray-600 pb-2">
                                  <span className="text-gray-400">Aircraft Operations</span>
                                  <span className="text-white font-medium">$12,850</span>
                                </div>
                                <div className="text-xs text-gray-500 -mt-2 mb-2">
                                  • Additional fuel: $4,200<br/>
                                  • Airport fees: $3,400<br/>
                                  • Ground handling: $2,850<br/>
                                  • Navigation charges: $2,400
                                </div>

                                <div className="flex justify-between pt-2 border-t border-green-500">
                                  <span className="text-green-300 font-semibold">Total Cost</span>
                                  <span className="text-green-400 font-bold text-lg">$110,450</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="bg-gray-700/50 border-gray-600">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-blue-300 text-lg">Halifax - Cost Details</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="flex justify-between border-b border-gray-600 pb-2">
                                  <span className="text-gray-400">Passenger Care (298 pax)</span>
                                  <span className="text-white font-medium">$95,200</span>
                                </div>
                                <div className="text-xs text-gray-500 -mt-2 mb-2">
                                  • Hotel accommodation: $220/night × 298 = $65,560<br/>
                                  • Meals & transport: $100/pax = $29,640
                                </div>

                                <div className="flex justify-between border-b border-gray-600 pb-2">
                                  <span className="text-gray-400">Crew Costs</span>
                                  <span className="text-white font-medium">$9,600</span>
                                </div>
                                <div className="text-xs text-gray-500 -mt-2 mb-2">
                                  • Flight crew duty extension: $3,600<br/>
                                  • Cabin crew overtime: $2,800<br/>
                                  • Accommodation: $3,200
                                </div>

                                <div className="flex justify-between border-b border-gray-600 pb-2">
                                  <span className="text-gray-400">Aircraft Operations</span>
                                  <span className="text-white font-medium">$17,800</span>
                                </div>
                                <div className="text-xs text-gray-500 -mt-2 mb-2">
                                  • Additional fuel: $6,400<br/>
                                  • Airport fees: $4,200<br/>
                                  • Ground handling: $3,600<br/>
                                  • Navigation charges: $3,600
                                </div>

                                <div className="flex justify-between pt-2 border-t border-blue-500">
                                  <span className="text-blue-300 font-semibold">Total Cost</span>
                                  <span className="text-blue-400 font-bold text-lg">$122,600</span>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Financial Impact Assessment */}
                        <Card className="bg-orange-900/20 border-orange-500/50">
                          <CardHeader>
                            <CardTitle className="text-orange-300 flex items-center gap-2">
                              <TrendingUp className="h-5 w-5" />
                              Financial Impact Assessment
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid md:grid-cols-3 gap-4">
                              <div className="text-center">
                                <div className="text-orange-400 font-bold text-2xl">$110K</div>
                                <div className="text-gray-400 text-sm">Direct Costs</div>
                              </div>
                              <div className="text-center">
                                <div className="text-yellow-400 font-bold text-2xl">$85K</div>
                                <div className="text-gray-400 text-sm">Revenue Loss</div>
                              </div>
                              <div className="text-center">
                                <div className="text-red-400 font-bold text-2xl">$195K</div>
                                <div className="text-gray-400 text-sm">Total Impact</div>
                              </div>
                            </div>
                            <div className="mt-4 text-sm text-gray-300">
                              <strong>Revenue Impact:</strong> Delayed departure for next rotation (VS127D JFK-LHR) 
                              affects 285 passengers with estimated revenue loss of $85,000.
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="crew" className="space-y-4">
                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        Crew Management & Regulatory Compliance
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Flight Crew Status */}
                        <div className="grid md:grid-cols-2 gap-6">
                          <Card className="bg-gray-700/50 border-gray-600">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-blue-300 text-lg flex items-center gap-2">
                                <Plane className="h-5 w-5" />
                                Flight Crew
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-4">
                                <div className="bg-gray-800/50 rounded-lg p-3">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-white font-medium">Captain J. Harrison</span>
                                    <Badge className="bg-green-600 text-white">LEGAL</Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-gray-400">Duty Time:</span>
                                      <div className="text-white">8h 47m / 14h</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Flight Time:</span>
                                      <div className="text-white">6h 12m / 8h</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Rest Period:</span>
                                      <div className="text-green-400">12h ago</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Extension:</span>
                                      <div className="text-yellow-400">+3h available</div>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-gray-800/50 rounded-lg p-3">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-white font-medium">F/O M. Chen</span>
                                    <Badge className="bg-green-600 text-white">LEGAL</Badge>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                      <span className="text-gray-400">Duty Time:</span>
                                      <div className="text-white">8h 47m / 14h</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Flight Time:</span>
                                      <div className="text-white">6h 12m / 8h</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Rest Period:</span>
                                      <div className="text-green-400">12h ago</div>
                                    </div>
                                    <div>
                                      <span className="text-gray-400">Extension:</span>
                                      <div className="text-yellow-400">+3h available</div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="bg-gray-700/50 border-gray-600">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-purple-300 text-lg flex items-center gap-2">
                                <Users className="h-5 w-5" />
                                Cabin Crew
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="bg-gray-800/50 rounded-lg p-3">
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="text-white font-medium">Purser S. Williams</span>
                                    <Badge className="bg-yellow-600 text-white">CAUTION</Badge>
                                  </div>
                                  <div className="text-sm">
                                    <div className="text-gray-400">Duty: <span className="text-white">11h 15m / 14h</span></div>
                                    <div className="text-gray-400">Remaining: <span className="text-yellow-400">2h 45m</span></div>
                                  </div>
                                </div>

                                <div className="bg-gray-800/50 rounded-lg p-3">
                                  <div className="text-white font-medium mb-2">Cabin Crew (8 members)</div>
                                  <div className="text-sm">
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Average Duty:</span>
                                      <span className="text-white">10h 52m / 14h</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-gray-400">Status:</span>
                                      <span className="text-green-400">6 Legal, 2 Caution</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="bg-orange-900/30 border border-orange-500/50 rounded-lg p-3">
                                  <div className="text-orange-300 font-medium mb-1">Fatigue Assessment</div>
                                  <div className="text-sm text-gray-300">
                                    2 crew members approaching duty limits. Extension available but fatigue monitoring required.
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Regulatory Compliance */}
                        <Card className="bg-blue-900/20 border-blue-500/50">
                          <CardHeader>
                            <CardTitle className="text-blue-300 flex items-center gap-2">
                              <Shield className="h-5 w-5" />
                              Regulatory Compliance Analysis
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid md:grid-cols-3 gap-4">
                              <div className="bg-gray-700/50 rounded-lg p-4">
                                <div className="text-green-400 font-semibold mb-2">EASA FTL Compliance</div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Daily FDP:</span>
                                    <span className="text-green-400">Compliant</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Weekly FDP:</span>
                                    <span className="text-green-400">Compliant</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Rest Requirements:</span>
                                    <span className="text-green-400">Met</span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-gray-700/50 rounded-lg p-4">
                                <div className="text-yellow-400 font-semibold mb-2">Diversion Impact</div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Extension Required:</span>
                                    <span className="text-yellow-400">+3h max</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Commander Authority:</span>
                                    <span className="text-green-400">Available</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Safety Margin:</span>
                                    <span className="text-yellow-400">Acceptable</span>
                                  </div>
                                </div>
                              </div>

                              <div className="bg-gray-700/50 rounded-lg p-4">
                                <div className="text-blue-400 font-semibold mb-2">Recovery Plan</div>
                                <div className="space-y-2 text-sm">
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Positioning Crew:</span>
                                    <span className="text-blue-400">Required</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Next Duty:</span>
                                    <span className="text-white">36h rest</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-gray-400">Rotation Impact:</span>
                                    <span className="text-yellow-400">Manageable</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Crew Scheduling Impact */}
                        <Card className="bg-red-900/20 border-red-500/50">
                          <CardHeader>
                            <CardTitle className="text-red-300 flex items-center gap-2">
                              <Clock className="h-5 w-5" />
                              Scheduling & Rotation Impact
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="grid md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-white font-medium mb-2">Immediate Impact</h4>
                                  <ul className="space-y-1 text-sm text-gray-300">
                                    <li>• Current crew can complete diversion legally</li>
                                    <li>• Commander discretionary extension available (+3h)</li>
                                    <li>• Fatigue risk assessment: LOW to MODERATE</li>
                                    <li>• Medical emergency justifies extension</li>
                                  </ul>
                                </div>
                                <div>
                                  <h4 className="text-white font-medium mb-2">Recovery Requirements</h4>
                                  <ul className="space-y-1 text-sm text-gray-300">
                                    <li>• Positioning crew needed for aircraft recovery</li>
                                    <li>• Current crew: minimum 12h rest before next duty</li>
                                    <li>• Next rotation (VS127D): requires standby crew</li>
                                    <li>• Total crew cost impact: $8,200 - $9,600</li>
                                  </ul>
                                </div>
                              </div>

                              <div className="bg-gray-700/30 rounded-lg p-3">
                                <div className="text-orange-300 font-medium mb-2">Recommendation</div>
                                <div className="text-gray-300 text-sm">
                                  <strong>Proceed with diversion.</strong> Current crew is legal for both Gander and Halifax options. 
                                  Commander discretionary extension provides adequate safety margin. Positioning crew arrangements 
                                  should be initiated immediately for aircraft recovery.
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="reports" className="space-y-4">
                  <Card className="bg-gray-800/50 border-gray-600">
                    <CardHeader>
                      <CardTitle className="text-white flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Operational Reports & Documentation
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-6">
                        {/* Executive Summary Report */}
                        <Card className="bg-blue-900/20 border-blue-500/50">
                          <CardHeader className="pb-3">
                            <CardTitle className="text-blue-300 flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Executive Summary Report
                              </div>
                              <Button className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1">
                                Generate PDF
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-4">
                              <div className="bg-gray-700/50 rounded-lg p-4">
                                <h4 className="text-white font-semibold mb-3">VIR127C Medical Emergency - Decision Summary</h4>
                                <div className="grid md:grid-cols-2 gap-4 text-sm">
                                  <div>
                                    <div className="text-gray-400">Incident Time:</div>
                                    <div className="text-white">2024-06-15 21:47 UTC</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-400">Decision Time:</div>
                                    <div className="text-white">2024-06-15 21:52 UTC</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-400">Recommended Action:</div>
                                    <div className="text-green-400">Divert to Gander (CYQX)</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-400">Total Cost Impact:</div>
                                    <div className="text-white">$195,000</div>
                                  </div>
                                </div>
                              </div>

                              <div className="grid md:grid-cols-3 gap-4">
                                <div className="bg-gray-700/30 rounded-lg p-3">
                                  <div className="text-green-400 font-medium">Safety Rating</div>
                                  <div className="text-white text-xl font-bold">EXCELLENT</div>
                                  <div className="text-gray-400 text-sm">All safety protocols followed</div>
                                </div>
                                <div className="bg-gray-700/30 rounded-lg p-3">
                                  <div className="text-blue-400 font-medium">Regulatory Compliance</div>
                                  <div className="text-white text-xl font-bold">FULL</div>
                                  <div className="text-gray-400 text-sm">EASA FTL compliant</div>
                                </div>
                                <div className="bg-gray-700/30 rounded-lg p-3">
                                  <div className="text-yellow-400 font-medium">Cost Efficiency</div>
                                  <div className="text-white text-xl font-bold">OPTIMAL</div>
                                  <div className="text-gray-400 text-sm">$12K savings vs alternative</div>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Regulatory Documentation */}
                        <div className="grid md:grid-cols-2 gap-6">
                          <Card className="bg-gray-700/50 border-gray-600">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-orange-300 flex items-center justify-between text-lg">
                                <div className="flex items-center gap-2">
                                  <Shield className="h-5 w-5" />
                                  Regulatory Reports
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                                  <div>
                                    <div className="text-white font-medium">ASR (Air Safety Report)</div>
                                    <div className="text-gray-400 text-sm">Medical emergency notification</div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge className="bg-green-600 text-white">SUBMITTED</Badge>
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1">
                                      View
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                                  <div>
                                    <div className="text-white font-medium">MOR (Mandatory Occurrence Report)</div>
                                    <div className="text-gray-400 text-sm">EASA regulatory filing</div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge className="bg-yellow-600 text-white">PENDING</Badge>
                                    <Button className="bg-orange-600 hover:bg-orange-700 text-white text-xs px-2 py-1">
                                      Generate
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                                  <div>
                                    <div className="text-white font-medium">CAA Notification</div>
                                    <div className="text-gray-400 text-sm">UK Civil Aviation Authority</div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge className="bg-green-600 text-white">SENT</Badge>
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1">
                                      View
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                                  <div>
                                    <div className="text-white font-medium">FTL Extension Report</div>
                                    <div className="text-gray-400 text-sm">Crew duty time extension</div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge className="bg-blue-600 text-white">AUTO-GEN</Badge>
                                    <Button className="bg-blue-600 hover:bg-blue-700 text-white text-xs px-2 py-1">
                                      View
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>

                          <Card className="bg-gray-700/50 border-gray-600">
                            <CardHeader className="pb-3">
                              <CardTitle className="text-purple-300 flex items-center text-lg">
                                <div className="flex items-center gap-2">
                                  <TrendingUp className="h-5 w-5" />
                                  Operational Reports
                                </div>
                              </CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                                  <div>
                                    <div className="text-white font-medium">Fuel Analysis Report</div>
                                    <div className="text-gray-400 text-sm">Consumption & efficiency metrics</div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge className="bg-green-600 text-white">READY</Badge>
                                    <Button className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1">
                                      Download
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                                  <div>
                                    <div className="text-white font-medium">Cost Impact Analysis</div>
                                    <div className="text-gray-400 text-sm">Financial breakdown & variance</div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge className="bg-green-600 text-white">READY</Badge>
                                    <Button className="bg-green-600 hover:bg-green-700 text-white text-xs px-2 py-1">
                                      Download
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                                  <div>
                                    <div className="text-white font-medium">Passenger Impact Report</div>
                                    <div className="text-gray-400 text-sm">Care costs & compensation</div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge className="bg-blue-600 text-white">PROCESSING</Badge>
                                    <Button className="bg-gray-600 hover:bg-gray-700 text-white text-xs px-2 py-1">
                                      Queue
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                                  <div>
                                    <div className="text-white font-medium">Network Impact Assessment</div>
                                    <div className="text-gray-400 text-sm">Schedule disruption analysis</div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Badge className="bg-yellow-600 text-white">PENDING</Badge>
                                    <Button className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs px-2 py-1">
                                      Generate
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </div>

                        {/* Decision Timeline & Audit Trail */}
                        <Card className="bg-green-900/20 border-green-500/50">
                          <CardHeader>
                            <CardTitle className="text-green-300 flex items-center gap-2">
                              <Clock className="h-5 w-5" />
                              Decision Timeline & Audit Trail
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg">
                                <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                                <div className="flex-1">
                                  <div className="text-white font-medium">21:47 UTC - Medical Emergency Declared</div>
                                  <div className="text-gray-400 text-sm">Passenger medical incident reported by cabin crew</div>
                                </div>
                                <div className="text-gray-400 text-sm">Flight Crew</div>
                              </div>

                              <div className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg">
                                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                                <div className="flex-1">
                                  <div className="text-white font-medium">21:48 UTC - AINO System Activated</div>
                                  <div className="text-gray-400 text-sm">Automated analysis initiated, diversion options calculated</div>
                                </div>
                                <div className="text-gray-400 text-sm">AI System</div>
                              </div>

                              <div className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg">
                                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                <div className="flex-1">
                                  <div className="text-white font-medium">21:49 UTC - Operations Center Notified</div>
                                  <div className="text-gray-400 text-sm">Watch manager alerted, coordination initiated</div>
                                </div>
                                <div className="text-gray-400 text-sm">OCC London</div>
                              </div>

                              <div className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg">
                                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                                <div className="flex-1">
                                  <div className="text-white font-medium">21:51 UTC - ATC Coordination</div>
                                  <div className="text-gray-400 text-sm">Gander Control contacted, diversion clearance requested</div>
                                </div>
                                <div className="text-gray-400 text-sm">Flight Crew</div>
                              </div>

                              <div className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <div className="flex-1">
                                  <div className="text-white font-medium">21:52 UTC - Decision Confirmed</div>
                                  <div className="text-gray-400 text-sm">Diversion to Gander approved by Captain and Operations</div>
                                </div>
                                <div className="text-gray-400 text-sm">Joint Decision</div>
                              </div>

                              <div className="flex items-center gap-4 p-3 bg-gray-700/30 rounded-lg">
                                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                <div className="flex-1">
                                  <div className="text-white font-medium">21:53 UTC - Ground Services Activated</div>
                                  <div className="text-gray-400 text-sm">Medical, passenger care, and recovery teams mobilized</div>
                                </div>
                                <div className="text-gray-400 text-sm">Ground Ops</div>
                              </div>
                            </div>

                            <div className="mt-4 p-3 bg-green-900/30 border border-green-500/50 rounded-lg">
                              <div className="text-green-300 font-medium mb-2">Audit Compliance</div>
                              <div className="text-sm text-gray-300">
                                Complete decision audit trail captured. All regulatory requirements met for documentation, 
                                crew duty time extensions, and passenger care provisions. Total decision time: 5 minutes from 
                                emergency declaration to action confirmation.
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Report Generation Actions */}
                        <Card className="bg-gray-700/50 border-gray-600">
                          <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                              <FileText className="h-5 w-5" />
                              Generate Custom Reports
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="grid md:grid-cols-3 gap-4">
                              <Button className="bg-blue-600 hover:bg-blue-700 text-white p-4 h-auto flex flex-col items-center gap-2">
                                <FileText className="h-6 w-6" />
                                <span>Executive Summary</span>
                                <span className="text-xs opacity-75">PDF | 2 pages</span>
                              </Button>
                              
                              <Button className="bg-green-600 hover:bg-green-700 text-white p-4 h-auto flex flex-col items-center gap-2">
                                <BarChart3 className="h-6 w-6" />
                                <span>Financial Analysis</span>
                                <span className="text-xs opacity-75">Excel | Charts</span>
                              </Button>
                              
                              <Button className="bg-purple-600 hover:bg-purple-700 text-white p-4 h-auto flex flex-col items-center gap-2">
                                <Shield className="h-6 w-6" />
                                <span>Compliance Report</span>
                                <span className="text-xs opacity-75">PDF | Regulatory</span>
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
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
    </div>
  );
}