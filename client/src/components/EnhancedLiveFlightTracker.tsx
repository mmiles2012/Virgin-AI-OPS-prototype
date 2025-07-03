import { useState, useEffect } from 'react';
import { 
  Plane, 
  MapPin, 
  Clock, 
  Navigation, 
  Fuel, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp,
  Activity,
  Thermometer,
  Wind,
  Gauge
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';

interface FlightData {
  callsign: string;
  flight_number: string;
  aircraft: string;
  route: string;
  origin: string;
  destination: string;
  altitude: number;
  velocity: number;
  heading: number;
  latitude: number;
  longitude: number;
  fuel_remaining: number;
  current_status: string;
  flight_progress: number;
  distance_remaining: number;
  delay_minutes: number;
  warnings: string[];
  scheduled_departure: string;
  scheduled_arrival: string;
  digital_twin_data?: any;
}

interface EnhancedFlightData extends FlightData {
  // Enhanced realistic data
  passengers: number;
  cargo_weight: number;
  departure_gate: string;
  arrival_gate: string;
  estimated_flight_time: string;
  weather_conditions: {
    wind_speed: number;
    wind_direction: number;
    temperature: number;
    visibility: number;
  };
  engine_status: {
    engine1_temp: number;
    engine2_temp: number;
    engine1_thrust: number;
    engine2_thrust: number;
  };
  systems_status: {
    hydraulics: 'NORMAL' | 'CAUTION' | 'WARNING';
    electrical: 'NORMAL' | 'CAUTION' | 'WARNING';
    pressurization: 'NORMAL' | 'CAUTION' | 'WARNING';
    autopilot: boolean;
  };
}

export default function EnhancedLiveFlightTracker() {
  const [flights, setFlights] = useState<EnhancedFlightData[]>([]);
  const [selectedFlightId, setSelectedFlightId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const enhanceFlightData = (baseFlights: FlightData[]): EnhancedFlightData[] => {
    return baseFlights.map(flight => ({
      ...flight,
      passengers: Math.floor(180 + Math.random() * 120), // 180-300 passengers
      cargo_weight: Math.floor(8000 + Math.random() * 12000), // 8-20 tons cargo
      departure_gate: flight.origin === 'LHR' ? `T3-${Math.floor(Math.random() * 20) + 1}` : 
                     flight.origin === 'MAN' ? `T2-${Math.floor(Math.random() * 15) + 1}` :
                     `${Math.floor(Math.random() * 30) + 1}`,
      arrival_gate: flight.destination === 'LHR' ? `T3-${Math.floor(Math.random() * 20) + 1}` : 
                   flight.destination === 'JFK' ? `T4-${Math.floor(Math.random() * 12) + 1}` :
                   `${Math.floor(Math.random() * 25) + 1}`,
      estimated_flight_time: calculateFlightTime(flight.origin, flight.destination),
      weather_conditions: {
        wind_speed: Math.floor(15 + Math.random() * 25), // 15-40 knots
        wind_direction: Math.floor(Math.random() * 360),
        temperature: flight.altitude > 30000 ? -45 - Math.random() * 15 : // High altitude temp
                    15 + Math.random() * 20, // Ground level temp
        visibility: 8 + Math.random() * 2 // 8-10 km visibility
      },
      engine_status: {
        engine1_temp: 750 + Math.random() * 100, // 750-850°C
        engine2_temp: 750 + Math.random() * 100,
        engine1_thrust: 85 + Math.random() * 10, // 85-95% thrust
        engine2_thrust: 85 + Math.random() * 10
      },
      systems_status: {
        hydraulics: Math.random() > 0.95 ? 'CAUTION' : 'NORMAL',
        electrical: Math.random() > 0.98 ? 'CAUTION' : 'NORMAL',
        pressurization: Math.random() > 0.99 ? 'CAUTION' : 'NORMAL',
        autopilot: flight.altitude > 15000 // Autopilot engaged above 15,000ft
      }
    }));
  };

  const calculateFlightTime = (origin: string, destination: string): string => {
    const flightTimes: { [key: string]: string } = {
      'LHR-JFK': '8h 15m',
      'LHR-LAX': '11h 30m',
      'LHR-BOS': '7h 45m',
      'LHR-MIA': '9h 20m',
      'LHR-ATL': '9h 05m',
      'LHR-MCO': '9h 10m',
      'MAN-JFK': '8h 30m',
      'LHR-ANU': '8h 40m',
      'LHR-MBJ': '9h 35m',
      'LHR-BGI': '8h 55m'
    };
    return flightTimes[`${origin}-${destination}`] || '8h 00m';
  };

  const fetchFlightData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/aviation/virgin-atlantic-flights');
      const data = await response.json();
      
      if (data.success && data.flights) {
        const enhancedFlights = enhanceFlightData(data.flights);
        setFlights(enhancedFlights);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Failed to fetch flight data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlightData();
  }, []);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(fetchFlightData, 30000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DEPARTED': return 'bg-blue-600';
      case 'EN_ROUTE': return 'bg-green-600';
      case 'APPROACHING': return 'bg-yellow-600';
      case 'LANDED': return 'bg-gray-600';
      default: return 'bg-blue-600';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'DEPARTED': return 'Departed';
      case 'EN_ROUTE': return 'En Route';
      case 'APPROACHING': return 'Approaching';
      case 'LANDED': return 'Landed';
      default: return 'Unknown';
    }
  };

  const selectedFlight = flights.find(f => f.callsign === selectedFlightId);

  return (
    <div className="space-y-6 h-full overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Activity className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Live Flight Tracking</h2>
          <Badge className="bg-red-600 text-white">
            {flights.length} Active Flights
          </Badge>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              autoRefresh 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {autoRefresh ? 'Auto Refresh On' : 'Auto Refresh Off'}
          </button>
          <Button
            onClick={fetchFlightData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? 'Updating...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {lastUpdate && (
        <div className="text-sm text-gray-400">
          Last updated: {lastUpdate.toLocaleTimeString()}
          {autoRefresh && <span className="ml-2 text-green-400">(Auto-refreshing every 30s)</span>}
        </div>
      )}

      {/* Flight List */}
      <div className="space-y-3">
        {flights.map((flight, index) => {
          const uniqueKey = `${flight.callsign}-${flight.origin}-${flight.destination}-${index}`;
          return (
            <Card key={uniqueKey} className="bg-gray-800/50 border-gray-600">
            <CardContent className="p-4">
              <div 
                className="cursor-pointer"
                onClick={() => setSelectedFlightId(
                  selectedFlightId === flight.callsign ? null : flight.callsign
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${getStatusColor(flight.current_status)}`}></div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold text-lg">{flight.callsign}</span>
                          <Badge className="bg-red-600 text-white text-xs">
                            {flight.aircraft}
                          </Badge>
                        </div>
                        <div className="text-sm text-gray-400">
                          {flight.origin} → {flight.destination} • {getStatusText(flight.current_status)}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6 text-sm">
                    <div className="text-center">
                      <div className="text-gray-400">Altitude</div>
                      <div className="text-white font-mono">{flight.altitude.toLocaleString()} ft</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Speed</div>
                      <div className="text-white font-mono">{Math.round(flight.velocity)} kts</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Progress</div>
                      <div className="text-white font-mono">{flight.flight_progress}%</div>
                    </div>
                    <div className="text-center">
                      <div className="text-gray-400">Fuel</div>
                      <div className="text-white font-mono">{Math.round(flight.fuel_remaining)}%</div>
                    </div>
                    {selectedFlightId === flight.callsign ? 
                      <ChevronUp className="h-5 w-5 text-gray-400" /> : 
                      <ChevronDown className="h-5 w-5 text-gray-400" />
                    }
                  </div>
                </div>

                {/* Warnings */}
                {flight.warnings && flight.warnings.length > 0 && (
                  <div className="mt-2 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <div className="flex gap-2">
                      {flight.warnings.map((warning, index) => (
                        <Badge key={index} className="bg-yellow-600 text-yellow-100 text-xs">
                          {warning}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Expanded Details */}
              {selectedFlightId === flight.callsign && (
                <div className="mt-4 pt-4 border-t border-gray-600 space-y-4">
                  {/* Flight Details Grid */}
                  <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                      <div className="text-blue-300 font-medium mb-2">Flight Information</div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Passengers:</span>
                          <span className="text-white">{flight.passengers}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Cargo:</span>
                          <span className="text-white">{(flight.cargo_weight / 1000).toFixed(1)}t</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Dep Gate:</span>
                          <span className="text-white">{flight.departure_gate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Arr Gate:</span>
                          <span className="text-white">{flight.arrival_gate}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-green-300 font-medium mb-2">Position & Navigation</div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Latitude:</span>
                          <span className="text-white font-mono">{flight.latitude.toFixed(4)}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Longitude:</span>
                          <span className="text-white font-mono">{flight.longitude.toFixed(4)}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Heading:</span>
                          <span className="text-white font-mono">{Math.round(flight.heading)}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Distance:</span>
                          <span className="text-white">{flight.distance_remaining} nm</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-yellow-300 font-medium mb-2">Weather Conditions</div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Wind:</span>
                          <span className="text-white">{flight.weather_conditions.wind_speed}kt @ {flight.weather_conditions.wind_direction}°</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Temp:</span>
                          <span className="text-white">{Math.round(flight.weather_conditions.temperature)}°C</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Visibility:</span>
                          <span className="text-white">{flight.weather_conditions.visibility.toFixed(1)}km</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="text-red-300 font-medium mb-2">Aircraft Systems</div>
                      <div className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-gray-400">Hydraulics:</span>
                          <Badge className={`text-xs ${flight.systems_status.hydraulics === 'NORMAL' ? 'bg-green-600' : 'bg-yellow-600'}`}>
                            {flight.systems_status.hydraulics}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Electrical:</span>
                          <Badge className={`text-xs ${flight.systems_status.electrical === 'NORMAL' ? 'bg-green-600' : 'bg-yellow-600'}`}>
                            {flight.systems_status.electrical}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-400">Autopilot:</span>
                          <Badge className={`text-xs ${flight.systems_status.autopilot ? 'bg-green-600' : 'bg-gray-600'}`}>
                            {flight.systems_status.autopilot ? 'ENGAGED' : 'MANUAL'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Engine Status */}
                  <div>
                    <div className="text-orange-300 font-medium mb-2">Engine Performance</div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-gray-700/50 rounded p-3">
                        <div className="text-sm font-medium text-white mb-2">Engine 1</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Temperature:</span>
                            <span className="text-white">{Math.round(flight.engine_status.engine1_temp)}°C</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Thrust:</span>
                            <span className="text-white">{Math.round(flight.engine_status.engine1_thrust)}%</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gray-700/50 rounded p-3">
                        <div className="text-sm font-medium text-white mb-2">Engine 2</div>
                        <div className="space-y-1 text-xs">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Temperature:</span>
                            <span className="text-white">{Math.round(flight.engine_status.engine2_temp)}°C</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-400">Thrust:</span>
                            <span className="text-white">{Math.round(flight.engine_status.engine2_thrust)}%</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Digital Twin Data */}
                  {flight.digital_twin_data && (
                    <div>
                      <div className="text-purple-300 font-medium mb-2">Digital Twin Performance</div>
                      <div className="bg-purple-900/20 rounded p-3 text-xs">
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <span className="text-gray-400">Fuel Efficiency:</span>
                            <span className="text-white ml-2">
                              {flight.digital_twin_data.performance_calculations?.fuel_efficiency_kg_per_hour?.toFixed(0) || 'N/A'} kg/h
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Operational Cost:</span>
                            <span className="text-white ml-2">
                              ${flight.digital_twin_data.performance_calculations?.operational_cost_usd?.toFixed(0) || 'N/A'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Cost/Passenger:</span>
                            <span className="text-white ml-2">
                              ${flight.digital_twin_data.performance_calculations?.cost_per_passenger_usd?.toFixed(0) || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
            </Card>
          );
        })}
      </div>

      {flights.length === 0 && !loading && (
        <div className="text-center py-8">
          <Plane className="h-12 w-12 text-gray-600 mx-auto mb-3" />
          <div className="text-gray-400">No active flights found</div>
          <Button onClick={fetchFlightData} className="mt-3 bg-blue-600 hover:bg-blue-700">
            Refresh Flight Data
          </Button>
        </div>
      )}
    </div>
  );
}