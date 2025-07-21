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
      <div className="min-h-screen w-full bg-gray-50 text-gray-900 p-6">
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
      <div className="min-h-screen w-full bg-gray-50 text-gray-900 p-6">
        <Card className="bg-va-red-primary/10 border-red-500/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-va-red-primary" />
              <div>
                <h3 className="text-lg font-semibold text-va-red-primary">Error Loading Holding Data</h3>
                <p className="text-red-300 mt-1">{error}</p>
                <Button 
                  onClick={fetchHoldingData} 
                  className="mt-3 bg-va-red-primary hover:bg-va-red-heritage"
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
    <div className="min-h-screen w-full bg-gray-50 text-gray-900 p-6 overflow-y-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Plane className="w-8 h-8 text-aero-blue-primary" />
            <div>
              <h1 className="text-2xl font-bold">Heathrow Holding Areas Monitor</h1>
              <p className="text-muted-foreground">Real-time airborne holding pattern detection</p>
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
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-500/20 rounded-lg">
                <Plane className="w-5 h-5 text-aero-blue-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Holding</p>
                <p className="text-2xl font-bold text-foreground">
                  {holdingData?.holding_status?.totalHolding || 0}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {holdingData?.holding_areas?.map((stack) => (
          <Card key={stack.code} className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <MapPin className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stack.name} ({stack.code})</p>
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
        <TabsList className="bg-card border-border">
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
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-aero-green-safe" />
                  <span>Current Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Total Aircraft Holding:</span>
                    <span className="text-2xl font-bold text-foreground">
                      {holdingData?.holding_status?.totalHolding || 0}
                    </span>
                  </div>
                  
                  {holdingData?.holding_areas?.map((stack) => (
                    <div key={stack.code} className="flex justify-between items-center">
                      <span className="text-muted-foreground">{stack.name} ({stack.code}):</span>
                      <span className={`font-semibold ${getStackStatusColor(stack.currentCount)}`}>
                        {stack.currentCount} aircraft
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Holding Stacks Map Info */}
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <MapPin className="w-5 h-5 text-aero-blue-primary" />
                  <span>Holding Stack Locations</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {holdingData?.holding_areas?.map((stack) => (
                    <div key={stack.code} className="p-3 bg-gray-700/50 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-semibold text-foreground">{stack.name}</h4>
                          <p className="text-sm text-muted-foreground">Code: {stack.code}</p>
                          <p className="text-xs text-foreground0">
                            {stack.lat.toFixed(4)}°N, {Math.abs(stack.lon).toFixed(4)}°W
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Altitude Range</p>
                          <p className="text-xs text-foreground0">
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
              <Card key={stack.code} className="bg-card border-border">
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
                        <p className="text-sm text-muted-foreground">Stack Code</p>
                        <p className="font-semibold text-foreground">{stack.code}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Radius</p>
                        <p className="font-semibold text-foreground">{stack.radius} km</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Coordinates</p>
                        <p className="font-semibold text-foreground text-sm">
                          {stack.lat.toFixed(4)}°N<br />
                          {Math.abs(stack.lon).toFixed(4)}°W
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Altitude Range</p>
                        <p className="font-semibold text-foreground text-sm">
                          {stack.minAltitude}ft<br />
                          {stack.maxAltitude}ft
                        </p>
                      </div>
                    </div>
                    
                    {stack.currentCount > 0 && (
                      <div className="p-3 bg-va-red-primary/10 border border-red-500/30 rounded-lg">
                        <p className="text-va-red-primary font-semibold">
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
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle>Virgin Atlantic Flights - Holding Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              {holdingData?.holding_analysis?.flights?.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left p-2 text-muted-foreground">Flight</th>
                        <th className="text-left p-2 text-muted-foreground">Route</th>
                        <th className="text-left p-2 text-muted-foreground">Aircraft</th>
                        <th className="text-left p-2 text-muted-foreground">Position</th>
                        <th className="text-left p-2 text-muted-foreground">Altitude</th>
                        <th className="text-left p-2 text-muted-foreground">Holding Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdingData.holding_analysis.flights.map((flight) => (
                        <tr key={flight.flight_number} className="border-b border-border/50">
                          <td className="p-2">
                            <div>
                              <p className="font-semibold text-foreground">{flight.flight_number}</p>
                              <p className="text-xs text-muted-foreground">{flight.registration || 'N/A'}</p>
                            </div>
                          </td>
                          <td className="p-2 text-muted-foreground">{flight.route}</td>
                          <td className="p-2 text-muted-foreground">{flight.aircraft_type}</td>
                          <td className="p-2">
                            <p className="text-xs text-muted-foreground">
                              {flight.latitude?.toFixed(4) || 'N/A'}°N<br />
                              {flight.longitude ? Math.abs(flight.longitude).toFixed(4) : 'N/A'}°W
                            </p>
                          </td>
                          <td className="p-2 text-muted-foreground">{flight.altitude || 'N/A'}ft</td>
                          <td className="p-2">
                            {flight.holding && flight.holding.isHolding ? (
                              <div>
                                <Badge variant="destructive" className="mb-1">
                                  HOLDING
                                </Badge>
                                <p className="text-xs text-muted-foreground">
                                  Stack: {flight.holding.stackName}<br />
                                  Confidence: {flight.holding.confidence}%
                                </p>
                              </div>
                            ) : (
                              <div>
                                <Badge variant="secondary">
                                  {flight.route && flight.route.startsWith('LHR-') ? 
                                    'Outbound' : 'Not Holding'}
                                </Badge>
                                {flight.route && flight.route.startsWith('LHR-') && (
                                  <p className="text-xs text-foreground0 mt-1">
                                    Holding stacks apply to inbound flights only
                                  </p>
                                )}
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Plane className="w-12 h-12 text-foreground0 mx-auto mb-3" />
                  <p className="text-muted-foreground">No flights currently being analyzed for holding patterns</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-aero-amber-caution" />
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
                  <AlertTriangle className="w-12 h-12 text-foreground0 mx-auto mb-3" />
                  <p className="text-muted-foreground">No active holding alerts</p>
                  <p className="text-sm text-foreground0 mt-1">
                    All holding stacks are operating normally
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="mt-8 pt-6 border-t border-border">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
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