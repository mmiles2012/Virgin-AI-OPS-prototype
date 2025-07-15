import React, { useState, useEffect } from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertTriangle, Clock, MapPin, TrendingUp, Wifi, WifiOff } from 'lucide-react';

interface AirportEvent {
  airport: string;
  eventType: string;
  eventTime: string;
  avgDelay: string | null;
  reason: string;
  scope: string;
  isVirginAtlanticDestination: boolean;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  impact: {
    level: string;
    description: string;
  };
}

interface ForecastEvent {
  time: string;
  event: string;
  airports: string[];
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  virginAtlanticRelevance: 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH';
}

interface VirginAtlanticImpact {
  currentImpacts: Array<{
    airport: string;
    eventType: string;
    severity: string;
    impact: {
      level: string;
      description: string;
    };
  }>;
  forecastImpacts: Array<{
    time: string;
    event: string;
    airports: string[];
    severity: string;
    relevance: string;
  }>;
  overallRisk: 'NORMAL' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  recommendations: string[];
}

interface FAAStatusData {
  timestamp: string;
  dataSource: string;
  airportEvents: AirportEvent[];
  enRouteEvents: any[];
  forecastEvents: ForecastEvent[];
  virginAtlanticImpact: VirginAtlanticImpact;
  summary: {
    activeEvents: number;
    criticalEvents: number;
    virginAtlanticAffected: number;
    forecastCount: number;
    status: 'NORMAL' | 'IMPACTED' | 'DISRUPTED';
  };
  monitoredAirports: number;
  fallback?: boolean;
}

export default function FAAStatusDashboard() {
  const [faaData, setFaaData] = useState<FAAStatusData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchFAAStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/faa/nas-status');
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      if (result.success) {
        setFaaData(result.data);
        setLastUpdate(new Date());
      } else {
        throw new Error(result.error || 'Failed to fetch FAA data');
      }
    } catch (err) {
      console.error('FAA Status fetch error:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFAAStatus();
    
    // Auto-refresh every 3 minutes
    const interval = setInterval(fetchFAAStatus, 180000);
    
    return () => clearInterval(interval);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL': return 'bg-red-500 text-white';
      case 'HIGH': return 'bg-orange-500 text-white';
      case 'MEDIUM': return 'bg-yellow-500 text-white';
      case 'LOW': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'CRITICAL': return 'bg-red-600 text-white';
      case 'HIGH': return 'bg-orange-600 text-white';
      case 'MEDIUM': return 'bg-yellow-600 text-white';
      case 'LOW': return 'bg-blue-600 text-white';
      case 'NORMAL': return 'bg-green-600 text-white';
      default: return 'bg-gray-600 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'DISRUPTED': return 'bg-red-500 text-white';
      case 'IMPACTED': return 'bg-orange-500 text-white';
      case 'NORMAL': return 'bg-green-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">FAA NAS Status</h2>
          <div className="flex items-center text-blue-400">
            <Wifi className="w-4 h-4 mr-2 animate-pulse" />
            <span>Loading...</span>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-700 rounded mb-2"></div>
                  <div className="h-8 bg-gray-700 rounded"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-white">FAA NAS Status</h2>
          <div className="flex items-center text-red-400">
            <WifiOff className="w-4 h-4 mr-2" />
            <span>Connection Error</span>
          </div>
        </div>
        <Card className="bg-red-900/20 border-red-700">
          <CardContent className="p-6">
            <div className="flex items-center text-red-400">
              <AlertTriangle className="w-5 h-5 mr-2" />
              <span>Error: {error}</span>
            </div>
            <button 
              onClick={fetchFAAStatus}
              className="mt-4 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
            >
              Retry Connection
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!faaData) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">FAA NAS Status</h2>
        <div className="flex items-center space-x-4">
          {faaData.fallback && (
            <Badge className="bg-yellow-600 text-white">
              <AlertTriangle className="w-3 h-3 mr-1" />
              Fallback Mode
            </Badge>
          )}
          <div className="flex items-center text-green-400">
            <Wifi className="w-4 h-4 mr-2" />
            <span className="text-sm">
              {lastUpdate ? `Updated ${lastUpdate.toLocaleTimeString()}` : 'Connected'}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">System Status</p>
                <p className="text-2xl font-bold text-white">{faaData.summary.status}</p>
              </div>
              <Badge className={getStatusColor(faaData.summary.status)}>
                {faaData.summary.status}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Active Events</p>
                <p className="text-2xl font-bold text-white">{faaData.summary.activeEvents}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Virgin Atlantic Impact</p>
                <p className="text-2xl font-bold text-white">{faaData.summary.virginAtlanticAffected}</p>
              </div>
              <Badge className={getRiskColor(faaData.virginAtlanticImpact.overallRisk)}>
                {faaData.virginAtlanticImpact.overallRisk}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Forecast Events</p>
                <p className="text-2xl font-bold text-white">{faaData.summary.forecastCount}</p>
              </div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Information */}
      <Tabs defaultValue="current" className="w-full">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="current" className="data-[state=active]:bg-blue-600">
            Current Events ({faaData.airportEvents.length})
          </TabsTrigger>
          <TabsTrigger value="forecast" className="data-[state=active]:bg-blue-600">
            Forecast Events ({faaData.forecastEvents.length})
          </TabsTrigger>
          <TabsTrigger value="virgin" className="data-[state=active]:bg-blue-600">
            Virgin Atlantic Impact
          </TabsTrigger>
        </TabsList>

        {/* Current Events */}
        <TabsContent value="current" className="space-y-4">
          {faaData.airportEvents.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <p className="text-gray-400">No active airport events</p>
              </CardContent>
            </Card>
          ) : (
            faaData.airportEvents.map((event, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <MapPin className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-white">{event.airport}</span>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        {event.isVirginAtlanticDestination && (
                          <Badge className="bg-purple-600 text-white">Virgin Atlantic</Badge>
                        )}
                      </div>
                      <p className="text-white font-semibold">{event.eventType}</p>
                      <p className="text-gray-400 text-sm">{event.reason}</p>
                      {event.avgDelay && (
                        <p className="text-orange-400 text-sm">Average Delay: {event.avgDelay}</p>
                      )}
                      <p className="text-gray-500 text-xs mt-2">{event.eventTime}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Forecast Events */}
        <TabsContent value="forecast" className="space-y-4">
          {faaData.forecastEvents.length === 0 ? (
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6 text-center">
                <p className="text-gray-400">No forecast events</p>
              </CardContent>
            </Card>
          ) : (
            faaData.forecastEvents.map((event, index) => (
              <Card key={index} className="bg-gray-800 border-gray-700">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <span className="font-bold text-white">{event.time}</span>
                        <Badge className={getSeverityColor(event.severity)}>
                          {event.severity}
                        </Badge>
                        {event.virginAtlanticRelevance !== 'NONE' && (
                          <Badge className="bg-purple-600 text-white">
                            {event.virginAtlanticRelevance} Impact
                          </Badge>
                        )}
                      </div>
                      <p className="text-white">{event.event}</p>
                      {event.airports.length > 0 && (
                        <p className="text-gray-400 text-sm">
                          Airports: {event.airports.join(', ')}
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Virgin Atlantic Impact */}
        <TabsContent value="virgin" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Overall Risk Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center space-x-4 mb-4">
                <Badge className={getRiskColor(faaData.virginAtlanticImpact.overallRisk)} size="lg">
                  {faaData.virginAtlanticImpact.overallRisk}
                </Badge>
                <p className="text-gray-400">
                  {faaData.virginAtlanticImpact.currentImpacts.length} current impacts, 
                  {faaData.virginAtlanticImpact.forecastImpacts.length} forecast impacts
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="text-white font-semibold">Operational Recommendations:</h4>
                {faaData.virginAtlanticImpact.recommendations.map((rec, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <p className="text-gray-300 text-sm">{rec}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Current Impacts */}
          {faaData.virginAtlanticImpact.currentImpacts.length > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Current Impacts</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {faaData.virginAtlanticImpact.currentImpacts.map((impact, index) => (
                  <div key={index} className="border-l-4 border-orange-500 pl-4">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-white">{impact.airport}</span>
                      <Badge className={getSeverityColor(impact.severity)}>
                        {impact.severity}
                      </Badge>
                    </div>
                    <p className="text-gray-400 text-sm">{impact.eventType}</p>
                    <p className="text-gray-300 text-sm">{impact.impact.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Data Source Info */}
      <Card className="bg-gray-800 border-gray-700">
        <CardContent className="p-4">
          <div className="flex items-center justify-between text-sm text-gray-400">
            <span>Data Source: {faaData.dataSource}</span>
            <span>Monitoring {faaData.monitoredAirports} Virgin Atlantic destinations</span>
            <span>Last Updated: {new Date(faaData.timestamp).toLocaleString()}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}