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
  registration: string;
  aircraft_type: string;
  current_flight: string;
  route: string;
  status: string;
  health_score: number;
  fuel_efficiency: number;
  maintenance_due_days: number;
  flight_hours: number;
  cycles: number;
  last_inspection: string;
  next_maintenance: string;
  engine_health: {
    engine1_health: number;
    engine2_health: number;
    total_hours: number;
    performance_trend: string;
  };
  real_time_data: {
    current_warnings: string[];
    position: {
      latitude: number;
      longitude: number;
      altitude: number;
      speed: number;
    };
  };
}

export default function VirginAtlanticFleetMonitor() {
  const [fleetData, setFleetData] = useState<FleetData[]>([]);
  const [selectedAircraft, setSelectedAircraft] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  // Fetch real-time Virgin Atlantic fleet data from backend
  useEffect(() => {
    const fetchFleetData = async (): Promise<FleetData[]> => {
      try {
        setError('');
        const response = await fetch('/api/fleet/virgin-atlantic/status');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.fleet_data) {
            return data.fleet_data;
          }
        }
        throw new Error('Failed to fetch fleet data');
      } catch (error) {
        console.error('Failed to fetch fleet data:', error);
        setError('Unable to connect to fleet monitoring system');
        return [];
      }
    };

    const loadData = async () => {
      try {
        const data = await fetchFleetData();
        setFleetData(data);
        setSelectedAircraft(data[0]?.registration || '');
        setLoading(false);
      } catch (err) {
        setError('Failed to load fleet data');
        setLoading(false);
      }
    };

    loadData();

    // Update fleet data every 30 seconds
    const interval = setInterval(async () => {
      try {
        const data = await fetchFleetData();
        setFleetData(data);
      } catch (err) {
        console.error('Failed to update fleet data:', err);
      }
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const selectedAircraftData = fleetData.find(a => a.registration === selectedAircraft);

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

  const safeGet = (obj: any, path: string, defaultValue: any = 'N/A') => {
    try {
      return obj && obj[path] !== undefined ? obj[path] : defaultValue;
    } catch {
      return defaultValue;
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

  if (error) {
    return (
      <Card className="aviation-panel">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertTriangle className="h-8 w-8 text-red-400 mb-2" />
          <span className="text-red-400 text-center">{error}</span>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </CardContent>
      </Card>
    );
  }

  if (fleetData.length === 0) {
    return (
      <Card className="aviation-panel">
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Plane className="h-8 w-8 text-gray-400 mb-2" />
          <span className="text-gray-400">No fleet data available</span>
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
                    {fleetData.length > 0 ? Math.round(fleetData.reduce((sum, a) => sum + a.health_score, 0) / fleetData.length) : 0}%
                  </div>
                </div>
                <div className="bg-gray-800/50 rounded p-3">
                  <div className="text-blue-300 text-sm">Active Warnings</div>
                  <div className="text-2xl font-bold text-yellow-400">
                    {fleetData.reduce((sum, a) => sum + (a.real_time_data?.current_warnings?.length || 0), 0)}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="text-white font-medium">Fleet Status</h3>
                {fleetData.map(aircraft => (
                  <div 
                    key={aircraft.registration}
                    className={`bg-gray-800/30 rounded p-3 cursor-pointer transition-colors ${
                      selectedAircraft === aircraft.registration ? 'bg-blue-900/50 border border-blue-600' : 'hover:bg-gray-800/50'
                    }`}
                    onClick={() => setSelectedAircraft(aircraft.registration)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-white font-mono">{aircraft.registration}</div>
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
                      {selectedAircraftData.registration} - {selectedAircraftData.aircraft_type}
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
                          value={selectedAircraftData.engine_health.engine1_health} 
                          className="mt-1"
                        />
                        <div className="text-sm mt-1 text-white">
                          {selectedAircraftData.engine_health.engine1_health}%
                        </div>
                      </div>
                      <div>
                        <div className="text-blue-300 text-sm">Engine 2 Health</div>
                        <Progress 
                          value={selectedAircraftData.engine_health.engine2_health} 
                          className="mt-1"
                        />
                        <div className="text-sm mt-1 text-white">
                          {selectedAircraftData.engine_health.engine2_health}%
                        </div>
                      </div>
                    </div>

                    {selectedAircraftData.real_time_data?.current_warnings && selectedAircraftData.real_time_data.current_warnings.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-yellow-400 text-sm font-medium mb-2">Active Warnings</h4>
                        {selectedAircraftData.real_time_data.current_warnings.map((warning, index) => (
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
                            <span className="text-white">{selectedAircraftData.maintenance_due_days}</span>
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
                      {fleetData.length > 0 ? Math.round(fleetData.reduce((sum, a) => sum + a.fuel_efficiency, 0) / fleetData.length) : 0}%
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