import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Plane, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Fuel, 
  Wrench,
  TrendingUp,
  MapPin,
  Activity
} from 'lucide-react';

interface FleetData {
  aircraft_registration: string;
  aircraft_type: string;
  current_flight: string;
  route: string;
  status: string;
  health_score: number;
  fuel_efficiency: number;
  maintenance_due: number;
  flight_hours: number;
  cycles: number;
  last_inspection: string;
  next_maintenance: string;
  engine_health: {
    engine1: number;
    engine2: number;
    total_hours: number;
    performance_trend: string;
  };
  warnings: string[];
  position: {
    latitude: number;
    longitude: number;
    altitude: number;
    speed: number;
  };
}

export default function VirginAtlanticFleetMonitor() {
  const [fleetData, setFleetData] = useState<FleetData[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  // Generate realistic Virgin Atlantic fleet data
  useEffect(() => {
    const generateFleetData = (): FleetData[] => {
      const virginAtlanticFleet = [
        { reg: 'G-VEIL', type: 'A350-1000', flight: 'VS127C', route: 'LHR-JFK' },
        { reg: 'G-VJAM', type: 'A350-1000', flight: 'VS43', route: 'LGW-MCO' },
        { reg: 'G-VLIB', type: '787-9', flight: 'VS25F', route: 'LHR-LAX' },
        { reg: 'G-VNEW', type: 'A330-900', flight: 'VS155', route: 'MAN-ATL' },
        { reg: 'G-VRAY', type: '787-9', flight: 'VS9', route: 'LHR-BOS' },
        { reg: 'G-VWAG', type: 'A330-300', flight: 'VS89', route: 'LGW-SYD' },
        { reg: 'G-VGAS', type: 'A350-1000', flight: 'VS401', route: 'LHR-SFO' },
        { reg: 'G-VKSS', type: '787-9', flight: 'VS75', route: 'MAN-DFW' }
      ];

      return virginAtlanticFleet.map(aircraft => {
        const healthScore = Math.random() * 30 + 70; // 70-100%
        const isHealthy = healthScore > 85;
        const hasWarnings = Math.random() > 0.7;
        
        return {
          aircraft_registration: aircraft.reg,
          aircraft_type: aircraft.type,
          current_flight: aircraft.flight,
          route: aircraft.route,
          status: isHealthy ? 'Operational' : healthScore > 75 ? 'Caution' : 'Maintenance Required',
          health_score: Math.round(healthScore),
          fuel_efficiency: Math.round(Math.random() * 15 + 85), // 85-100%
          maintenance_due: Math.round(Math.random() * 30 + 5), // 5-35 days
          flight_hours: Math.round(Math.random() * 2000 + 8000), // 8000-10000 hours
          cycles: Math.round(Math.random() * 500 + 2500), // 2500-3000 cycles
          last_inspection: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          next_maintenance: new Date(Date.now() + (Math.random() * 30 + 5) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          engine_health: {
            engine1: Math.round(Math.random() * 20 + 80), // 80-100%
            engine2: Math.round(Math.random() * 20 + 80),
            total_hours: Math.round(Math.random() * 1000 + 7000),
            performance_trend: Math.random() > 0.5 ? 'Stable' : 'Declining'
          },
          warnings: hasWarnings ? [
            'Engine temperature slightly elevated',
            'Hydraulic pressure monitoring',
            'APU performance review recommended'
          ].slice(0, Math.ceil(Math.random() * 3)) : [],
          position: {
            latitude: Math.random() * 80 - 40, // -40 to 40
            longitude: Math.random() * 160 - 80, // -80 to 80
            altitude: Math.round(Math.random() * 10000 + 35000),
            speed: Math.round(Math.random() * 100 + 450)
          }
        };
      });
    };

    const data = generateFleetData();
    setFleetData(data);
    setSelectedAircraft(data[0]?.aircraft_registration || '');
    setLoading(false);

    // Update fleet data every 30 seconds
    const interval = setInterval(() => {
      setFleetData(generateFleetData());
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const selectedAircraftData = fleetData.find(a => a.aircraft_registration === selectedAircraft);

  const getHealthColor = (score: number) => {
    if (score >= 90) return 'text-green-400';
    if (score >= 75) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Operational': return <Badge className="bg-green-700">Operational</Badge>;
      case 'Caution': return <Badge variant="secondary">Caution</Badge>;
      default: return <Badge variant="destructive">Maintenance Required</Badge>;
    }
  };

  if (loading) {
    return (
      <Card className="aviation-panel">
        <CardContent className="flex items-center justify-center py-8">
          <Activity className="h-8 w-8 animate-spin text-blue-400" />
          <span className="ml-2 text-white">Loading Virgin Atlantic Fleet Data...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="aviation-panel">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Virgin Atlantic Fleet Intelligence
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4 bg-gray-800/50">
              <TabsTrigger value="overview">Fleet Overview</TabsTrigger>
              <TabsTrigger value="health">Health Monitor</TabsTrigger>
              <TabsTrigger value="maintenance">Maintenance</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-gray-800/50 rounded p-3">
                  <div className="text-blue-300 text-sm">Total Aircraft</div>
                  <div className="text-2xl font-bold text-white">{fleetData.length}</div>
                </div>
                <div className="bg-gray-800/50 rounded p-3">
                  <div className="text-blue-300 text-sm">Operational</div>
                  <div className="text-2xl font-bold text-green-400">
                    {fleetData.filter(a => a.status === 'Operational').length}
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded p-3">
                  <div className="text-blue-300 text-sm">Avg Health Score</div>
                  <div className="text-2xl font-bold text-white">
                    {Math.round(fleetData.reduce((sum, a) => sum + a.health_score, 0) / fleetData.length)}%
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded p-3">
                  <div className="text-blue-300 text-sm">Active Warnings</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {fleetData.reduce((sum, a) => sum + a.warnings.length, 0)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-medium">Fleet Status</h3>
                {fleetData.map(aircraft => (
                  <div 
                    key={aircraft.aircraft_registration}
                    className={`bg-gray-800/30 rounded p-3 cursor-pointer transition-colors ${
                      selectedAircraft === aircraft.aircraft_registration ? 'bg-blue-900/50 border border-blue-600' : 'hover:bg-gray-800/50'
                    }`}
                    onClick={() => setSelectedAircraft(aircraft.aircraft_registration)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-white font-mono">{aircraft.aircraft_registration}</div>
                        <div className="text-gray-400">{aircraft.aircraft_type}</div>
                        <div className="text-blue-300 text-sm">{aircraft.current_flight}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(aircraft.status)}
                        <div className={`text-sm ${getHealthColor(aircraft.health_score)}`}>
                          {aircraft.health_score}%
                        </div>
                      </div>
                    </div>
                    <div className="text-gray-400 text-sm mt-1">{aircraft.route}</div>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="health" className="space-y-4">
              {selectedAircraftData && (
                <div className="space-y-4">
                  <div className="bg-gray-800/50 rounded p-4">
                    <h3 className="text-white font-medium mb-3">
                      {selectedAircraftData.aircraft_registration} - {selectedAircraftData.aircraft_type}
                    </h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <div className="text-blue-300 text-sm">Overall Health</div>
                        <Progress 
                          value={selectedAircraftData.health_score} 
                          className="mt-1"
                        />
                        <div className={`text-sm mt-1 ${getHealthColor(selectedAircraftData.health_score)}`}>
                          {selectedAircraftData.health_score}%
                        </div>
                      </div>
                      <div>
                        <div className="text-blue-300 text-sm">Fuel Efficiency</div>
                        <Progress 
                          value={selectedAircraftData.fuel_efficiency} 
                          className="mt-1"
                        />
                        <div className="text-sm mt-1 text-green-400">
                          {selectedAircraftData.fuel_efficiency}%
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-blue-300 text-sm">Engine 1 Health</div>
                        <Progress 
                          value={selectedAircraftData.engine_health.engine1} 
                          className="mt-1"
                        />
                        <div className="text-sm mt-1 text-white">
                          {selectedAircraftData.engine_health.engine1}%
                        </div>
                      </div>
                      <div>
                        <div className="text-blue-300 text-sm">Engine 2 Health</div>
                        <Progress 
                          value={selectedAircraftData.engine_health.engine2} 
                          className="mt-1"
                        />
                        <div className="text-sm mt-1 text-white">
                          {selectedAircraftData.engine_health.engine2}%
                        </div>
                      </div>
                    </div>

                    {selectedAircraftData.warnings.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-yellow-400 text-sm font-medium mb-2">Active Warnings</h4>
                        {selectedAircraftData.warnings.map((warning, index) => (
                          <Alert key={index} className="border-yellow-600/50 bg-yellow-900/20 mb-2">
                            <AlertTriangle className="h-4 w-4 text-yellow-400" />
                            <AlertDescription className="text-yellow-300">
                              {warning}
                            </AlertDescription>
                          </Alert>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="maintenance" className="space-y-4">
              {selectedAircraftData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-gray-800/30">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Wrench className="h-4 w-4 text-blue-400" />
                          <span className="text-blue-300 text-sm">Maintenance Schedule</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Days until next maintenance:</span>
                            <span className="text-white">{selectedAircraftData.maintenance_due}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Last inspection:</span>
                            <span className="text-white">{selectedAircraftData.last_inspection}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Next maintenance:</span>
                            <span className="text-white">{selectedAircraftData.next_maintenance}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gray-800/30">
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Clock className="h-4 w-4 text-blue-400" />
                          <span className="text-blue-300 text-sm">Utilization Data</span>
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Flight hours:</span>
                            <span className="text-white">{selectedAircraftData.flight_hours.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Flight cycles:</span>
                            <span className="text-white">{selectedAircraftData.cycles.toLocaleString()}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400 text-sm">Engine hours:</span>
                            <span className="text-white">{selectedAircraftData.engine_health.total_hours.toLocaleString()}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="analytics" className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Card className="bg-gray-800/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span className="text-blue-300 text-sm">Fleet Efficiency</span>
                    </div>
                    <div className="text-2xl font-bold text-green-400 mb-1">
                      {Math.round(fleetData.reduce((sum, a) => sum + a.fuel_efficiency, 0) / fleetData.length)}%
                    </div>
                    <div className="text-gray-400 text-xs">Average fuel efficiency</div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle className="h-4 w-4 text-blue-400" />
                      <span className="text-blue-300 text-sm">Reliability</span>
                    </div>
                    <div className="text-2xl font-bold text-white mb-1">97.8%</div>
                    <div className="text-gray-400 text-xs">On-time performance</div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Fuel className="h-4 w-4 text-yellow-400" />
                      <span className="text-blue-300 text-sm">Cost Savings</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-400 mb-1">£2.4M</div>
                    <div className="text-gray-400 text-xs">This quarter</div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}