import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { 
  Plane, 
  MapPin, 
  AlertTriangle, 
  Clock, 
  Activity,
  Database,
  Shield,
  TrendingUp,
  Gauge
} from 'lucide-react';

interface ICAOFlightData {
  icao24: string;
  callsign: string;
  registration: string;
  aircraft_type: string;
  operator: string;
  origin: string;
  destination: string;
  position: {
    latitude: number;
    longitude: number;
    altitude_ft: number;
    heading: number;
  };
  speed: {
    ground_speed_kts: number;
    indicated_airspeed_kts: number;
    mach: number;
  };
  flight_phase: string;
  squawk: string;
  emergency: boolean;
  timestamp: string;
}

interface ICAOUsageData {
  calls_remaining: number;
  calls_used: number;
  rate_limit_reset: string;
  cache_efficiency: string;
}

interface ICAONotam {
  notam_id: string;
  airport_icao: string;
  type: string;
  condition: string;
  location: string;
  effective_from: string;
  effective_until: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affects_operations: boolean;
}

export default function ICAODashboard() {
  const [flights, setFlights] = useState<ICAOFlightData[]>([]);
  const [notams, setNotams] = useState<ICAONotam[]>([]);
  const [usage, setUsage] = useState<ICAOUsageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'error'>('unknown');

  // Test ICAO connection on component mount
  useEffect(() => {
    testConnection();
    fetchUsage();
  }, []);

  const testConnection = async () => {
    try {
      const response = await fetch('/api/icao/test-connection', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (data.icao_api_status?.success) {
        setConnectionStatus('connected');
      } else {
        setConnectionStatus('error');
      }
    } catch (error) {
      setConnectionStatus('error');
    }
  };

  const fetchUsage = async () => {
    try {
      const response = await fetch('/api/icao/usage');
      const data = await response.json();
      
      if (data.success) {
        setUsage(data.api_usage);
      }
    } catch (error) {
      console.error('Failed to fetch ICAO usage:', error);
    }
  };

  const fetchFlights = async (bounds?: { min_lat: number; max_lat: number; min_lon: number; max_lon: number }) => {
    setLoading(true);
    setError(null);
    
    try {
      let url = '/api/icao/flights';
      if (bounds) {
        const params = new URLSearchParams({
          min_lat: bounds.min_lat.toString(),
          max_lat: bounds.max_lat.toString(),
          min_lon: bounds.min_lon.toString(),
          max_lon: bounds.max_lon.toString()
        });
        url += `?${params}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setFlights(data.flights);
      } else {
        setError(data.message || 'Failed to fetch flight data');
      }
      
      // Refresh usage after API call
      await fetchUsage();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotams = async (airport?: string) => {
    setLoading(true);
    
    try {
      const url = airport ? `/api/icao/notams/${airport}` : '/api/icao/notams';
      const response = await fetch(url);
      const data = await response.json();
      
      if (data.success) {
        setNotams(data.notams);
      }
      
      await fetchUsage();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchVirginAtlanticFleet = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/icao/virgin-atlantic');
      const data = await response.json();
      
      if (data.success) {
        setFlights(data.fleet_aircraft);
      }
      
      await fetchUsage();
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const getUsageColor = () => {
    if (!usage) return 'bg-gray-500';
    const percentage = (usage.calls_used / 100) * 100;
    if (percentage > 80) return 'bg-red-500';
    if (percentage > 60) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ICAO Aviation Intelligence</h1>
          <p className="text-gray-600 mt-2">Official ICAO data with smart API management (100 calls/24hrs)</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className={`w-3 h-3 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' : 
              connectionStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
            }`} />
            <span className="text-sm font-medium">
              {connectionStatus === 'connected' ? 'ICAO Connected' : 
               connectionStatus === 'error' ? 'Connection Error' : 'Testing...'}
            </span>
          </div>
          
          {usage && (
            <Card className="min-w-[200px]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">API Calls</p>
                    <p className="text-2xl font-bold">{usage.calls_remaining}/100</p>
                  </div>
                  <Gauge className="h-8 w-8 text-blue-600" />
                </div>
                <div className="mt-2">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full ${getUsageColor()}`}
                      style={{ width: `${(usage.calls_used / 100) * 100}%` }}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <Tabs defaultValue="flights" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="flights">Live Flights</TabsTrigger>
          <TabsTrigger value="virgin-atlantic">Virgin Atlantic</TabsTrigger>
          <TabsTrigger value="notams">NOTAMs</TabsTrigger>
          <TabsTrigger value="intelligence">Intelligence</TabsTrigger>
        </TabsList>

        <TabsContent value="flights" className="space-y-4">
          <div className="flex space-x-4">
            <Button onClick={() => fetchFlights()} disabled={loading}>
              <Activity className="mr-2 h-4 w-4" />
              {loading ? 'Loading...' : 'Global Flights'}
            </Button>
            <Button 
              onClick={() => fetchFlights({ min_lat: 49.5, max_lat: 61.0, min_lon: -11.0, max_lon: 2.0 })} 
              disabled={loading}
              variant="outline"
            >
              <MapPin className="mr-2 h-4 w-4" />
              UK Flights
            </Button>
          </div>

          {error && (
            <Card className="border-red-200 bg-red-50">
              <CardContent className="p-4">
                <div className="flex items-center">
                  <AlertTriangle className="h-5 w-5 text-red-500 mr-2" />
                  <span className="text-red-700">{error}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {flights.map((flight, index) => (
              <Card key={flight.icao24 || index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full">
                        <Plane className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{flight.callsign || 'Unknown'}</h3>
                        <p className="text-sm text-gray-600">{flight.aircraft_type} • {flight.operator}</p>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="flex items-center space-x-2">
                        {flight.emergency && (
                          <Badge className="bg-red-100 text-red-800 border-red-200">
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            Emergency
                          </Badge>
                        )}
                        <Badge variant="outline">{flight.flight_phase}</Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500">Route</p>
                      <p className="font-medium">{flight.origin} → {flight.destination}</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Altitude</p>
                      <p className="font-medium">{flight.position?.altitude_ft?.toLocaleString()} ft</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Speed</p>
                      <p className="font-medium">{flight.speed?.ground_speed_kts} kts</p>
                    </div>
                    <div>
                      <p className="text-gray-500">Squawk</p>
                      <p className="font-medium">{flight.squawk}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="virgin-atlantic" className="space-y-4">
          <Button onClick={fetchVirginAtlanticFleet} disabled={loading}>
            <Shield className="mr-2 h-4 w-4" />
            {loading ? 'Loading...' : 'Load Virgin Atlantic Fleet'}
          </Button>

          <div className="grid gap-4">
            {flights.length > 0 && flights.map((flight, index) => (
              <Card key={flight.icao24 || index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full">
                        <Plane className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold">{flight.callsign}</h3>
                        <p className="text-sm text-gray-600">Virgin Atlantic • {flight.aircraft_type}</p>
                      </div>
                    </div>
                    <Badge className="bg-red-100 text-red-800 border-red-200">VIR</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="notams" className="space-y-4">
          <div className="flex space-x-4">
            <Button onClick={() => fetchNotams()} disabled={loading}>
              <Database className="mr-2 h-4 w-4" />
              {loading ? 'Loading...' : 'Global NOTAMs'}
            </Button>
            <Button onClick={() => fetchNotams('EGLL')} disabled={loading} variant="outline">
              Heathrow NOTAMs
            </Button>
          </div>

          <div className="grid gap-4">
            {notams.map((notam, index) => (
              <Card key={notam.notam_id || index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <AlertTriangle className="h-5 w-5 text-orange-500" />
                      <h3 className="text-lg font-semibold">{notam.airport_icao}</h3>
                    </div>
                    <Badge className={getSeverityColor(notam.severity)}>
                      {notam.severity.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <p className="text-sm"><strong>Type:</strong> {notam.type}</p>
                    <p className="text-sm"><strong>Condition:</strong> {notam.condition}</p>
                    <p className="text-sm"><strong>Location:</strong> {notam.location}</p>
                    <p className="text-sm text-gray-600">{notam.description}</p>
                  </div>
                  
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Effective: {new Date(notam.effective_from).toLocaleDateString()}</span>
                      <span>Until: {new Date(notam.effective_until).toLocaleDateString()}</span>
                    </div>
                    {notam.affects_operations && (
                      <Badge variant="destructive">Affects Operations</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="intelligence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="mr-2 h-5 w-5" />
                ICAO Aviation Intelligence Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{flights.length}</div>
                  <p className="text-sm text-gray-600">Active Flights Tracked</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{notams.length}</div>
                  <p className="text-sm text-gray-600">Active NOTAMs</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {usage ? usage.calls_remaining : '100'}
                  </div>
                  <p className="text-sm text-gray-600">API Calls Remaining</p>
                </div>
              </div>
              
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">Smart API Management</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• Intelligent caching reduces redundant API calls</li>
                  <li>• Rate limiting prevents exceeding 100-call limit</li>
                  <li>• Priority given to critical flight operations data</li>
                  <li>• Cache-first strategy maximizes data availability</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}