import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useFlightState } from '../lib/stores/useFlightState';
import { useScenario } from '../lib/stores/useScenario';
import { useSelectedFlight } from '../lib/stores/useSelectedFlight';
import { AlertTriangle, Plane, MapPin, Clock } from 'lucide-react';
import LiveFlightTracker from './LiveFlightTracker';
import SafeAirspaceAlerts from './SafeAirspaceAlerts';

export default function OperationsCenter() {
  const { 
    position, 
    altitude, 
    airspeed, 
    fuelRemaining,
    engineTemps 
  } = useFlightState();
  
  const { selectedFlight } = useSelectedFlight();
  
  const { 
    currentScenario, 
    medicalEmergency, 
    nearestAirports,
    costAnalysis,
    handleDiversionDecision 
  } = useScenario();

  const [selectedDiversion, setSelectedDiversion] = useState<string>('');
  const [analysisMode, setAnalysisMode] = useState<'automatic' | 'manual'>('automatic');

  const handleOpsDecision = (airportCode: string, decision: 'approve' | 'deny') => {
    if (decision === 'approve') {
      handleDiversionDecision(airportCode, 'operations');
      console.log(`Operations Center approved diversion to ${airportCode}`);
    } else {
      console.log(`Operations Center denied diversion to ${airportCode}`);
    }
  };

  const calculateDiversionCost = (airport: any) => {
    const fuelCost = airport.distance * 2.5 * 5.5; // Distance * fuel burn rate * fuel price
    const timeCost = (airport.distance / airspeed) * 1500; // Time * hourly ops cost
    const passengerCost = medicalEmergency ? 50000 : 25000; // Medical vs weather compensation
    return fuelCost + timeCost + passengerCost;
  };

  return (
    <div className="absolute inset-4 pointer-events-auto overflow-auto">
      <div className="min-h-full grid grid-cols-3 gap-4">
        {/* Live Flight Tracker */}
        <div className="col-span-2">
          <LiveFlightTracker />
        </div>

        {/* Flight Status Overview */}
        <Card className="aviation-panel">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Plane className="h-5 w-5" />
              {selectedFlight ? `Flight ${selectedFlight.callsign}` : 'No Flight Selected'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedFlight ? (
              <>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-blue-300">Route</div>
                    <div className="text-white font-mono">
                      {selectedFlight.origin}→{selectedFlight.destination}
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-300">Aircraft</div>
                    <div className="text-white font-mono">{selectedFlight.aircraft}</div>
                  </div>
                  <div>
                    <div className="text-blue-300">Altitude</div>
                    <div className="text-white font-mono">{selectedFlight.altitude.toLocaleString()} ft</div>
                  </div>
                  <div>
                    <div className="text-blue-300">Speed</div>
                    <div className="text-white font-mono">{selectedFlight.velocity.toFixed(0)} kts</div>
                  </div>
                </div>

                <div className="border-t border-blue-500 pt-3">
                  <div className="text-blue-300 text-sm mb-2">Current Position</div>
                  <div className="text-white font-mono text-xs">
                    {selectedFlight.latitude.toFixed(4)}°, {selectedFlight.longitude.toFixed(4)}°
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Plane className="h-12 w-12 text-gray-600 mb-3" />
                <div className="text-gray-400 text-sm">No flight data available</div>
                <div className="text-gray-500 text-xs mt-1">
                  Click on a flight marker in the satellite map to select it for tracking
                </div>
              </div>
            )}

            <div className="space-y-2">
              {selectedFlight ? (
                <>
                  <Badge 
                    variant={selectedFlight.fuel > 15000 ? "default" : selectedFlight.fuel > 8000 ? "secondary" : "destructive"} 
                    className="w-full justify-center"
                  >
                    Fuel: {selectedFlight.fuel.toLocaleString()} kg
                  </Badge>
                  <Badge 
                    variant={selectedFlight.engineStatus === 'normal' ? "default" : "destructive"} 
                    className="w-full justify-center"
                  >
                    Engines: {selectedFlight.engineStatus}
                  </Badge>
                  <Badge 
                    variant={selectedFlight.systemsStatus === 'normal' ? "default" : "destructive"} 
                    className="w-full justify-center"
                  >
                    Systems: {selectedFlight.systemsStatus}
                  </Badge>
                </>
              ) : (
                <>
                  <Badge variant="outline" className="w-full justify-center text-gray-400">
                    Fuel: No Data
                  </Badge>
                  <Badge variant="outline" className="w-full justify-center text-gray-400">
                    Engines: No Data
                  </Badge>
                  <Badge variant="outline" className="w-full justify-center text-gray-400">
                    Systems: No Data
                  </Badge>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Emergency Management */}
        <Card className="aviation-panel">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Emergency Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {medicalEmergency && currentScenario?.type === 'medical' ? (
              <Alert className="border-red-500 bg-red-900/20">
                <AlertTriangle className="h-4 w-4 text-red-400" />
                <AlertDescription className="text-red-200">
                  Medical emergency declared. Passenger requires immediate hospital care.
                </AlertDescription>
              </Alert>
            ) : currentScenario?.type === 'technical' ? (
              <Alert className="border-orange-500 bg-orange-900/20">
                <AlertTriangle className="h-4 w-4 text-orange-400" />
                <AlertDescription className="text-orange-200">
                  Technical issue detected. Monitoring aircraft systems.
                </AlertDescription>
              </Alert>
            ) : currentScenario?.type === 'weather' ? (
              <Alert className="border-yellow-500 bg-yellow-900/20">
                <AlertTriangle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-200">
                  Severe weather alert. Evaluating route adjustments.
                </AlertDescription>
              </Alert>
            ) : currentScenario?.type === 'security' ? (
              <Alert className="border-purple-500 bg-purple-900/20">
                <AlertTriangle className="h-4 w-4 text-purple-400" />
                <AlertDescription className="text-purple-200">
                  Security incident reported. Following security protocols.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-green-500 bg-green-900/20">
                <AlertDescription className="text-green-200">
                  No active emergencies. Flight proceeding normally.
                </AlertDescription>
              </Alert>
            )}

            {currentScenario && (
              <div className="bg-blue-900/30 border border-blue-500 rounded p-3">
                <h4 className="text-blue-300 font-medium">{currentScenario.title}</h4>
                <p className="text-blue-200 text-sm mt-1">{currentScenario.description}</p>
                <div className="mt-2">
                  <Badge variant="outline" className="text-yellow-300 border-yellow-500">
                    Severity: {currentScenario.severity}
                  </Badge>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAnalysisMode('automatic')}
                className={analysisMode === 'automatic' ? 'bg-blue-600' : ''}
              >
                Auto Analysis
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAnalysisMode('manual')}
                className={analysisMode === 'manual' ? 'bg-blue-600' : ''}
              >
                Manual Review
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Diversion Options */}
        <Card className="aviation-panel">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Diversion Analysis
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {nearestAirports.slice(0, 4).map((airport, index) => {
              const cost = calculateDiversionCost(airport);
              const eta = new Date(Date.now() + (airport.distance / airspeed) * 3600000);
              
              return (
                <div
                  key={airport.icao}
                  className={`border rounded p-3 cursor-pointer transition-colors ${
                    selectedDiversion === airport.icao
                      ? 'border-blue-400 bg-blue-900/30'
                      : 'border-gray-600 hover:border-gray-500'
                  }`}
                  onClick={() => setSelectedDiversion(airport.icao)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="text-white font-medium">{airport.icao}</div>
                      <div className="text-blue-300 text-sm">{airport.name}</div>
                    </div>
                    <Badge variant={index === 0 ? "default" : "outline"} className="text-xs">
                      #{index + 1}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-blue-300">Distance</div>
                      <div className="text-white font-mono">{airport.distance.toFixed(0)} nm</div>
                    </div>
                    <div>
                      <div className="text-blue-300">ETA</div>
                      <div className="text-white font-mono">{eta.toLocaleTimeString('en-US', { hour12: false }).slice(0, 5)}</div>
                    </div>
                    <div>
                      <div className="text-blue-300">Medical</div>
                      <div className={airport.medicalFacilities ? "text-green-400" : "text-red-400"}>
                        {airport.medicalFacilities ? "YES" : "NO"}
                      </div>
                    </div>
                    <div>
                      <div className="text-blue-300">Cost</div>
                      <div className="text-yellow-400">${(cost / 1000).toFixed(0)}k</div>
                    </div>
                  </div>
                </div>
              );
            })}

            {selectedDiversion && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-600">
                <Button
                  onClick={() => handleOpsDecision(selectedDiversion, 'approve')}
                  className="bg-green-600 hover:bg-green-700"
                  size="sm"
                >
                  Approve
                </Button>
                <Button
                  onClick={() => handleOpsDecision(selectedDiversion, 'deny')}
                  variant="destructive"
                  size="sm"
                >
                  Deny
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Cost Analysis & Recommendations */}
        <Card className="aviation-panel">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Decision Support
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="costs" className="h-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="costs">Costs</TabsTrigger>
                <TabsTrigger value="recommendations">AI Rec</TabsTrigger>
              </TabsList>

              <TabsContent value="costs" className="space-y-3">
                <div className="text-sm">
                  <h4 className="text-blue-300 font-medium mb-2">Cost Breakdown</h4>
                  {nearestAirports.slice(0, 3).map((airport) => {
                    const cost = calculateDiversionCost(airport);
                    const fuelCost = airport.distance * 2.5 * 5.5;
                    const timeCost = (airport.distance / airspeed) * 1500;
                    const passengerCost = medicalEmergency ? 50000 : 25000;
                    
                    return (
                      <div key={airport.icao} className="border border-gray-600 rounded p-2 mb-2">
                        <div className="font-medium text-white">{airport.icao}</div>
                        <div className="text-xs space-y-1">
                          <div className="flex justify-between">
                            <span className="text-blue-300">Fuel:</span>
                            <span className="text-white">${fuelCost.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-300">Time:</span>
                            <span className="text-white">${timeCost.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-blue-300">Passenger:</span>
                            <span className="text-white">${passengerCost.toFixed(0)}</span>
                          </div>
                          <div className="flex justify-between font-medium border-t border-gray-700 pt-1">
                            <span className="text-blue-300">Total:</span>
                            <span className="text-yellow-400">${cost.toFixed(0)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-3">
                <div className="bg-green-900/30 border border-green-500 rounded p-3">
                  <h4 className="text-green-300 font-medium">AI Recommendation</h4>
                  {nearestAirports.length > 0 && (
                    <div className="mt-2 text-sm">
                      <div className="text-green-200">
                        Divert to <strong>{nearestAirports[0].icao}</strong>
                      </div>
                      <div className="text-green-300 text-xs mt-1">
                        Optimal balance of distance, medical facilities, and cost
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2 text-xs">
                  <div className="text-blue-300 font-medium">Decision Factors:</div>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Medical Priority</span>
                      <Badge variant="destructive" className="text-xs">HIGH</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Weather Impact</span>
                      <Badge variant="default" className="text-xs">LOW</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span>Fuel Criticality</span>
                      <Badge variant="default" className="text-xs">NORMAL</Badge>
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-600 pt-2">
                  <div className="text-blue-300 text-xs">Confidence Score</div>
                  <div className="text-2xl font-mono text-green-400">87%</div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* SafeAirspace Alerts */}
        <Card className="aviation-panel col-span-2">
          <SafeAirspaceAlerts />
        </Card>
      </div>
    </div>
  );
}
