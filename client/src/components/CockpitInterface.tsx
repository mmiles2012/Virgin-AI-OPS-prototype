import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useFlightState } from '../lib/stores/useFlightState';
import { useScenario } from '../lib/stores/useScenario';
import AviationGauge from './ui/aviation-gauge';
import FlightControls from './ui/flight-controls';

interface CockpitInterfaceProps {
  onEmergencyToggle: (active: boolean) => void;
}

export default function CockpitInterface({ onEmergencyToggle }: CockpitInterfaceProps) {
  const { 
    altitude, 
    airspeed, 
    heading, 
    throttle, 
    fuelRemaining, 
    isAutopilot,
    engineTemps,
    toggleAutopilot 
  } = useFlightState();
  
  const { 
    currentScenario, 
    medicalEmergency, 
    nearestAirports,
    handleDiversionDecision 
  } = useScenario();

  const [selectedAirport, setSelectedAirport] = useState<string>('');

  const handleEmergencyResponse = () => {
    if (medicalEmergency) {
      onEmergencyToggle(true);
      console.log("Emergency procedures activated by flight crew");
    }
  };

  const handleDiversion = () => {
    if (selectedAirport) {
      handleDiversionDecision(selectedAirport, 'crew');
      console.log(`Crew initiated diversion to ${selectedAirport}`);
    }
  };

  return (
    <div className="h-full grid grid-cols-3 gap-4">
        {/* Left Panel - Primary Flight Display */}
        <Card className="cockpit-display">
          <CardContent className="p-4 h-full">
            <h3 className="text-blue-300 font-semibold mb-4">Primary Flight Display</h3>
            
            <div className="grid grid-cols-2 gap-4 mb-6">
              <AviationGauge
                label="Airspeed"
                value={airspeed}
                min={0}
                max={600}
                unit="kts"
                color="#60a5fa"
              />
              <AviationGauge
                label="Altitude"
                value={altitude}
                min={0}
                max={45000}
                unit="ft"
                color="#34d399"
              />
              <AviationGauge
                label="Heading"
                value={heading}
                min={0}
                max={360}
                unit="°"
                color="#fbbf24"
              />
              <AviationGauge
                label="V/S"
                value={0}
                min={-6000}
                max={6000}
                unit="fpm"
                color="#a78bfa"
              />
            </div>

            {/* Attitude Indicator */}
            <div className="bg-card rounded-lg p-4 border border-blue-500">
              <h4 className="text-blue-300 text-sm mb-2">Attitude Indicator</h4>
              <div className="w-full h-32 bg-gradient-to-b from-blue-500 to-green-600 rounded relative overflow-hidden">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-8 h-1 bg-yellow-400"></div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-amber-700"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Center Panel - Navigation and Systems */}
        <Card className="cockpit-display">
          <CardContent className="p-4 h-full">
            <Tabs defaultValue="navigation" className="h-full">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="navigation">NAV</TabsTrigger>
                <TabsTrigger value="systems">SYS</TabsTrigger>
                <TabsTrigger value="emergency">EMRG</TabsTrigger>
              </TabsList>

              <TabsContent value="navigation" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-blue-300 text-sm">Autopilot</label>
                    <Button
                      onClick={toggleAutopilot}
                      variant={isAutopilot ? "default" : "outline"}
                      className="w-full mt-1"
                    >
                      {isAutopilot ? "ENGAGED" : "DISENGAGED"}
                    </Button>
                  </div>
                  <div>
                    <label className="text-blue-300 text-sm">Flight Mode</label>
                    <Badge variant={isAutopilot ? "default" : "destructive"} className="w-full justify-center mt-1">
                      {isAutopilot ? "AUTO" : "MANUAL"}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-blue-300 font-medium">Route Information</h4>
                  <div className="text-sm text-blue-200">
                    <div>Next Waypoint: KJFK</div>
                    <div>Distance: 1,247 nm</div>
                    <div>ETA: 14:32 UTC</div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="systems" className="space-y-4">
                <div>
                  <h4 className="text-blue-300 font-medium mb-2">Engine Parameters</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-200">Engine 1 Temp</span>
                      <span className="text-aero-green-safe">{engineTemps[0]}°C</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-200">Engine 2 Temp</span>
                      <span className="text-aero-green-safe">{engineTemps[1]}°C</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-200">Fuel Remaining</span>
                      <span className="text-aero-amber-caution">{fuelRemaining.toFixed(0)} lbs</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-blue-300 font-medium mb-2">System Status</h4>
                  <div className="space-y-1">
                    <Badge variant="default" className="w-full justify-center">Hydraulics: NORMAL</Badge>
                    <Badge variant="default" className="w-full justify-center">Electrical: NORMAL</Badge>
                    <Badge variant="default" className="w-full justify-center">Pressurization: NORMAL</Badge>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="emergency" className="space-y-4">
                {medicalEmergency ? (
                  <div className="space-y-4">
                    <div className="bg-red-900 border border-red-500 rounded p-3">
                      <h4 className="text-red-300 font-bold">MEDICAL EMERGENCY</h4>
                      <p className="text-red-200 text-sm mt-1">
                        Passenger requires immediate medical attention
                      </p>
                    </div>

                    <Button
                      onClick={handleEmergencyResponse}
                      className="w-full bg-va-red-primary hover:bg-va-red-heritage"
                    >
                      Declare Emergency
                    </Button>

                    <div>
                      <h4 className="text-blue-300 font-medium mb-2">Diversion Options</h4>
                      <div className="space-y-2">
                        {nearestAirports.slice(0, 3).map((airport) => (
                          <Button
                            key={airport.icao}
                            variant={selectedAirport === airport.icao ? "default" : "outline"}
                            className="w-full text-left justify-start"
                            onClick={() => setSelectedAirport(airport.icao)}
                          >
                            <div>
                              <div className="font-medium">{airport.icao} - {airport.name}</div>
                              <div className="text-xs opacity-75">
                                {airport.distance.toFixed(0)} nm • Medical: {airport.medicalFacilities ? "YES" : "NO"}
                              </div>
                            </div>
                          </Button>
                        ))}
                      </div>
                      
                      {selectedAirport && (
                        <Button
                          onClick={handleDiversion}
                          className="w-full mt-3 bg-orange-600 hover:bg-orange-700"
                        >
                          Execute Diversion to {selectedAirport}
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-blue-200 py-8">
                    <p>No active emergencies</p>
                    <p className="text-sm opacity-75 mt-1">Emergency procedures on standby</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Right Panel - Engine and Performance */}
        <Card className="cockpit-display">
          <CardContent className="p-4 h-full">
            <h3 className="text-blue-300 font-semibold mb-4">Engine & Performance</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-blue-300 text-sm block mb-2">Throttle Position</label>
                <Progress value={throttle} className="h-3" />
                <div className="text-right text-blue-200 text-sm mt-1">{throttle.toFixed(1)}%</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-blue-300 text-sm">Engine 1</div>
                  <div className="text-2xl font-mono text-aero-green-safe">{(throttle * 0.95).toFixed(0)}%</div>
                </div>
                <div className="text-center">
                  <div className="text-blue-300 text-sm">Engine 2</div>
                  <div className="text-2xl font-mono text-aero-green-safe">{(throttle * 1.02).toFixed(0)}%</div>
                </div>
              </div>

              <FlightControls />

              <div className="border-t border-blue-500 pt-4">
                <h4 className="text-blue-300 font-medium mb-2">Performance Data</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-blue-200">Mach Number</span>
                    <span className="text-foreground font-mono">{(airspeed / 661.47).toFixed(3)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Ground Speed</span>
                    <span className="text-foreground font-mono">{airspeed} kts</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-blue-200">Range</span>
                    <span className="text-foreground font-mono">{(fuelRemaining / 3.5).toFixed(0)} nm</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
  );
}
