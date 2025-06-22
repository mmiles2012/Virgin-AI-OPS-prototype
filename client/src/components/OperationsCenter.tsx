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

  // Safe property access helper
  const getFlightProperty = (obj: any, path: string, defaultValue: any = 'N/A') => {
    try {
      return obj && obj[path] !== undefined ? obj[path] : defaultValue;
    } catch {
      return defaultValue;
    }
  };

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
                      {getFlightProperty(selectedFlight, 'origin', '')}→{getFlightProperty(selectedFlight, 'destination', '')}
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-300">Aircraft</div>
                    <div className="text-white font-mono">{getFlightProperty(selectedFlight, 'aircraft', 'Unknown')}</div>
                  </div>
                  <div>
                    <div className="text-blue-300">Altitude</div>
                    <div className="text-white font-mono">{getFlightProperty(selectedFlight, 'altitude', 0).toLocaleString()} ft</div>
                  </div>
                  <div>
                    <div className="text-blue-300">Speed</div>
                    <div className="text-white font-mono">{getFlightProperty(selectedFlight, 'velocity', 0).toFixed(0)} kts</div>
                  </div>
                </div>

                <div className="border-t border-blue-500 pt-3">
                  <div className="text-blue-300 text-sm mb-2">Current Position</div>
                  <div className="text-white font-mono text-xs">
                    {getFlightProperty(selectedFlight, 'latitude', 0).toFixed(4)}°, {getFlightProperty(selectedFlight, 'longitude', 0).toFixed(4)}°
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
                    variant={
                      getFlightProperty(selectedFlight, 'fuel', 0) > 15000 ? "default" : 
                      getFlightProperty(selectedFlight, 'fuel', 0) > 8000 ? "secondary" : "destructive"
                    } 
                    className="w-full justify-center"
                  >
                    Fuel: {getFlightProperty(selectedFlight, 'fuel', 0) ? `${(getFlightProperty(selectedFlight, 'fuel', 0) / 1000).toFixed(1)}k kg` : 'N/A'}
                  </Badge>
                  <Badge 
                    variant={getFlightProperty(selectedFlight, 'engineStatus', 'normal') === 'normal' ? "default" : "destructive"}
                    className="w-full justify-center"
                  >
                    Engines: {getFlightProperty(selectedFlight, 'engineStatus', 'Normal')}
                  </Badge>
                  <Badge 
                    variant={getFlightProperty(selectedFlight, 'systemsStatus', 'normal') === 'normal' ? "default" : "destructive"} 
                    className="w-full justify-center"
                  >
                    Systems: {getFlightProperty(selectedFlight, 'systemsStatus', 'Normal')}
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
              Emergency Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentScenario ? (
              <>
                <Alert className="border-red-600/50 bg-red-900/20">
                  <AlertTriangle className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-300">
                    {currentScenario.type}: {currentScenario.description}
                  </AlertDescription>
                </Alert>

                <div className="space-y-3">
                  <div className="text-blue-300 text-sm font-medium">Recommended Actions</div>
                  {nearestAirports?.slice(0, 3).map((airport: any, index: number) => (
                    <div key={airport.icao} className="bg-gray-800/50 rounded p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="text-white font-medium">{airport.name}</div>
                          <div className="text-gray-400 text-sm">{airport.icao} • {airport.distance}nm</div>
                        </div>
                        <Badge variant={index === 0 ? "default" : "secondary"}>
                          {index === 0 ? "Primary" : "Alternate"}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <div className="text-gray-400">Cost Est.</div>
                          <div className="text-white">${calculateDiversionCost(airport).toLocaleString()}</div>
                        </div>
                        <div>
                          <div className="text-gray-400">ETA</div>
                          <div className="text-white">{Math.round(airport.distance / airspeed * 60)}min</div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleOpsDecision(airport.icao, 'approve')}
                          className="flex-1 bg-green-700 hover:bg-green-600 text-white"
                        >
                          Approve
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline" 
                          onClick={() => handleOpsDecision(airport.icao, 'deny')}
                          className="flex-1 border-red-600 text-red-400 hover:bg-red-900/20"
                        >
                          Deny
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <AlertTriangle className="h-12 w-12 text-gray-600 mb-3" />
                <div className="text-gray-400 text-sm">No active scenarios</div>
                <div className="text-gray-500 text-xs mt-1">System monitoring for operational alerts</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Operational Analysis */}
        <Card className="aviation-panel col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              AINO Decision Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="risk-assessment" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-gray-800/50">
                <TabsTrigger value="risk-assessment" className="text-xs">Risk Assessment</TabsTrigger>
                <TabsTrigger value="cost-analysis" className="text-xs">Cost Analysis</TabsTrigger>
                <TabsTrigger value="safety-metrics" className="text-xs">Safety Metrics</TabsTrigger>
              </TabsList>
              
              <TabsContent value="risk-assessment" className="space-y-4">
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div className="bg-gray-800/50 rounded p-3">
                    <div className="text-blue-300 text-xs mb-1">Weather Risk</div>
                    <div className="text-2xl font-mono text-yellow-400">Medium</div>
                    <div className="text-gray-400 text-xs">Visibility: 8nm</div>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3">
                    <div className="text-blue-300 text-xs mb-1">Fuel Risk</div>
                    <div className="text-2xl font-mono text-green-400">Low</div>
                    <div className="text-gray-400 text-xs">Reserve: 45min</div>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3">
                    <div className="text-blue-300 text-xs mb-1">Traffic Risk</div>
                    <div className="text-2xl font-mono text-green-400">Low</div>
                    <div className="text-gray-400 text-xs">Density: Normal</div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="cost-analysis" className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-gray-800/50 rounded p-3">
                    <div className="text-blue-300 text-xs mb-1">Fuel Cost</div>
                    <div className="text-2xl font-mono text-white">$12,400</div>
                    <div className="text-gray-400 text-xs">Current burn rate</div>
                  </div>
                  <div className="bg-gray-800/50 rounded p-3">
                    <div className="text-blue-300 text-xs mb-1">Delay Cost</div>
                    <div className="text-2xl font-mono text-orange-400">$8,200</div>
                    <div className="text-gray-400 text-xs">Per 30min delay</div>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="safety-metrics" className="space-y-4">
                <div className="bg-gray-800/50 rounded p-3">
                  <div className="text-blue-300 text-xs mb-2">AINO Safety Score</div>
                  <div className="flex items-end gap-4">
                    <div className="text-3xl font-mono text-green-400">9.2</div>
                    <div className="text-gray-400 text-xs pb-1">/10.0</div>
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