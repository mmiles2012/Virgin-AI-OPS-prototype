import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { AlertTriangle, Plane, MapPin, Clock, TrendingUp, Activity } from 'lucide-react';

interface HoldingStack {
  code: string;
  name: string;
  lat: number;
  lon: number;
  radius: number;
  minAltitude: number;
  maxAltitude: number;
  currentCount: number;
}

interface HoldingAlert {
  type: string;
  priority: string;
  message: string;
  stack?: string;
  stackName?: string;
  count?: number;
  details?: any;
}

interface FlightWithHolding {
  flight_number: string;
  airline: string;
  aircraft_type: string;
  route: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  registration: string;
  holding: {
    isHolding: boolean;
    stack: string | null;
    stackName: string | null;
    confidence: number;
    distance: number | null;
  };
}

interface HoldingData {
  success: boolean;
  holding_analysis: {
    summary: {
      totalHolding: number;
      stackCounts: Record<string, number>;
      alerts: HoldingAlert[];
    };
    flights: FlightWithHolding[];
  };
  holding_status: {
    totalHolding: number;
    stackCounts: Record<string, number>;
    activeHoldings: any[];
  };
  holding_alerts: HoldingAlert[];
  holding_areas: HoldingStack[];
  timestamp: string;
}

export default function HeathrowHoldingDashboard() {
  const [holdingData, setHoldingData] = useState<HoldingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchHoldingData = async () => {
    try {
      setError(null);
      const response = await fetch('/api/aviation/heathrow-holding');
      const data = await response.json();
      
      if (data.success) {
        setHoldingData(data);
      } else {
        setError(data.error || 'Failed to fetch holding data');
      }
    } catch (err) {
      setError('Network error fetching holding data');
      console.error('Error fetching holding data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHoldingData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchHoldingData, 30000); // 30 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 border-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStackStatusColor = (count: number) => {
    if (count === 0) return 'text-green-600';
    if (count <= 2) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-gray-900 text-white p-6">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center space-x-3">
            <Activity className="w-6 h-6 animate-spin" />
            <span className="text-lg">Loading Heathrow holding data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen w-full bg-gray-900 text-white p-6">
        <Card className="bg-red-900/20 border-red-500/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-red-400" />
              <div>
                <h3 className="text-lg font-semibold text-red-400">Error Loading Holding Data</h3>
                <p className="text-red-300 mt-1">{error}</p>
                <Button 
                  onClick={fetchHoldingData} 
                  className="mt-3 bg-red-600 hover:bg-red-700"
                >
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-gray-900 text-white p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Plane className="w-8 h-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold">Heathrow Holding Areas Monitor</h1>
              <p className="text-gray-300">Real-time airborne holding pattern detection</p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Badge variant={autoRefresh ? "default" : "secondary"}>
              {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
            </Badge>
            <Button
              onClick={() => setAutoRefresh(!autoRefresh)}
              variant="outline"
              size="sm"
            >
              {autoRefresh ? "Disable" : "Enable"} Auto-refresh
            </Button>
            <Button onClick={fetchHoldingData} size="sm">
              Refresh Now
            </Button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Plane className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Holding</p>
                <p className="text-2xl font-bold text-white">
                  {holdingData?.holding_status?.totalHolding || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {holdingData?.holding_areas?.map((stack) => (
          <Card key={stack.code} className="bg-gray-800 border-gray-700">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <MapPin className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">{stack.name} ({stack.code})</p>
                  <p className={`text-2xl font-bold ${getStackStatusColor(stack.currentCount)}`}>
                    {stack.currentCount}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="overview" className="data-[state=active]:bg-gray-700">
            Overview
          </TabsTrigger>
          <TabsTrigger value="stacks" className="data-[state=active]:bg-gray-700">
            Holding Stacks
          </TabsTrigger>
          <TabsTrigger value="flights" className="data-[state=active]:bg-gray-700">
            Active Flights
          </TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-gray-700">
            Alerts
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Current Status */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  <span>Current Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Aircraft Holding:</span>
                    <span className="text-2xl font-bold text-white">
                      {holdingData?.holding_status?.totalHolding || 0}
                    </span>
                  </div>
                  
                  {holdingData?.holding_areas?.map((stack) => (
                    <div key={stack.code} className="flex justify-between items-center">
                      <span className="text-gray-400">{stack.name} ({stack.code}):</span>
                      <span className={`font-semibold ${getStackStatusColor(stack.currentCount)}`}>
                        {stack.currentCount} aircraft
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Holding Stacks Map Info */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-blue-400" />
                  <span>Holding Stack Locations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {holdingData?.holding_areas?.map((stack) => (
                    <div key={stack.code} className="p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-white">{stack.name}</h4>
                          <p className="text-sm text-gray-400">Code: {stack.code}</p>
                          <p className="text-xs text-gray-500">
                            {stack.lat.toFixed(4)}°N, {Math.abs(stack.lon).toFixed(4)}°W
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-400">Altitude Range</p>
                          <p className="text-xs text-gray-500">
                            {stack.minAltitude}ft - {stack.maxAltitude}ft
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Holding Stacks Tab */}
        <TabsContent value="stacks" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {holdingData?.holding_areas?.map((stack) => (
              <Card key={stack.code} className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{stack.name} Holding Stack</span>
                    <Badge variant={stack.currentCount > 0 ? "destructive" : "secondary"}>
                      {stack.currentCount} aircraft
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Stack Code</p>
                        <p className="font-semibold text-white">{stack.code}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Radius</p>
                        <p className="font-semibold text-white">{stack.radius} km</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Coordinates</p>
                        <p className="font-semibold text-white text-sm">
                          {stack.lat.toFixed(4)}°N<br />
                          {Math.abs(stack.lon).toFixed(4)}°W
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Altitude Range</p>
                        <p className="font-semibold text-white text-sm">
                          {stack.minAltitude}ft<br />
                          {stack.maxAltitude}ft
                        </p>
                      </div>
                    </div>
                    
                    {stack.currentCount > 0 && (
                      <div className="p-3 bg-red-900/20 border border-red-500/30 rounded-lg">
                        <p className="text-red-400 font-semibold">
                          {stack.currentCount} aircraft currently holding
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Active Flights Tab */}
        <TabsContent value="flights" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle>Virgin Atlantic Flights - Holding Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {holdingData?.holding_analysis?.flights?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left p-2 text-gray-400">Flight</th>
                        <th className="text-left p-2 text-gray-400">Route</th>
                        <th className="text-left p-2 text-gray-400">Aircraft</th>
                        <th className="text-left p-2 text-gray-400">Position</th>
                        <th className="text-left p-2 text-gray-400">Altitude</th>
                        <th className="text-left p-2 text-gray-400">Holding Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdingData.holding_analysis.flights.map((flight) => (
                        <tr key={flight.flight_number} className="border-b border-gray-700/50">
                          <td className="p-2">
                            <div>
                              <p className="font-semibold text-white">{flight.flight_number}</p>
                              <p className="text-xs text-gray-400">{flight.registration}</p>
                            </div>
                          </td>
                          <td className="p-2 text-gray-300">{flight.route}</td>
                          <td className="p-2 text-gray-300">{flight.aircraft_type}</td>
                          <td className="p-2">
                            <p className="text-xs text-gray-400">
                              {flight.latitude.toFixed(4)}°N<br />
                              {flight.longitude.toFixed(4)}°W
                            </p>
                          </td>
                          <td className="p-2 text-gray-300">{flight.altitude}ft</td>
                          <td className="p-2">
                            {flight.holding.isHolding ? (
                              <div>
                                <Badge variant="destructive" className="mb-1">
                                  HOLDING
                                </Badge>
                                <p className="text-xs text-gray-400">
                                  Stack: {flight.holding.stackName}<br />
                                  Confidence: {flight.holding.confidence}%
                                </p>
                              </div>
                            ) : (
                              <Badge variant="secondary">Not Holding</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Plane className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No flights currently being analyzed for holding patterns</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <span>Holding Alerts</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {holdingData?.holding_alerts?.length > 0 ? (
                <div className="space-y-3">
                  {holdingData.holding_alerts.map((alert, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border ${getPriorityColor(alert.priority)}`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-semibold">{alert.type}</p>
                          <p className="mt-1">{alert.message}</p>
                          {alert.stackName && (
                            <p className="text-sm mt-2">
                              Stack: {alert.stackName} ({alert.stack})
                            </p>
                          )}
                        </div>
                        <Badge variant={alert.priority === 'high' ? 'destructive' : 'default'}>
                          {alert.priority.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <AlertTriangle className="w-12 h-12 text-gray-500 mx-auto mb-3" />
                  <p className="text-gray-400">No active holding alerts</p>
                  <p className="text-sm text-gray-500 mt-1">
                    All holding stacks are operating normally
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-gray-700">
        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>
            Last updated: {holdingData?.timestamp ? 
              new Date(holdingData.timestamp).toLocaleString() : 'Never'}
          </span>
          <span>AINO Heathrow Holding Monitor v1.0</span>
        </div>
      </div>
    </div>
  );
}