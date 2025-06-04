import { useState, useEffect } from 'react';
import { Plane, MapPin, Clock, Navigation, Fuel, AlertTriangle } from 'lucide-react';
import { useSelectedFlight } from '../lib/stores/useSelectedFlight';

interface LiveFlight {
  flight_number: string;
  aircraft: string;
  departure: string;
  arrival: string;
  status: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

interface FlightData {
  flights_found: number;
  sample_flight: LiveFlight;
  all_flights?: LiveFlight[];
  api_credits_used: number;
  timestamp: string;
}

export default function LiveFlightTracker() {
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const fetchLiveFlights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/aviation/virgin-atlantic-flights');
      const data = await response.json();
      
      if (data.success) {
        setFlightData(data.data);
        setLastUpdate(new Date());
      } else {
        console.error('Failed to fetch flight data:', data.message);
      }
    } catch (error) {
      console.error('Error fetching live flights:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveFlights();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchLiveFlights, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return 'text-green-400';
      case 'scheduled': return 'text-blue-400';
      case 'delayed': return 'text-yellow-400';
      case 'cancelled': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active': return <Plane className="h-4 w-4 text-green-400" />;
      case 'scheduled': return <Clock className="h-4 w-4 text-blue-400" />;
      case 'delayed': return <AlertTriangle className="h-4 w-4 text-yellow-400" />;
      case 'cancelled': return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default: return <MapPin className="h-4 w-4 text-gray-400" />;
    }
  };

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700 p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Plane className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Live Flight Tracking</h2>
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
          <button
            onClick={fetchLiveFlights}
            disabled={loading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      </div>

      {lastUpdate && (
        <div className="mb-4 text-sm text-gray-400">
          Last updated: {formatTime(lastUpdate)}
          {autoRefresh && <span className="ml-2 text-green-400">(Auto-refreshing every 30s)</span>}
        </div>
      )}

      {flightData ? (
        <div className="space-y-6">
          {/* Summary Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-600/30">
              <div className="flex items-center gap-2 mb-2">
                <Plane className="h-5 w-5 text-blue-400" />
                <span className="text-blue-300 font-medium">Active Flights</span>
              </div>
              <div className="text-2xl font-bold text-white">{flightData.flights_found}</div>
            </div>
            
            <div className="bg-green-900/30 rounded-lg p-4 border border-green-600/30">
              <div className="flex items-center gap-2 mb-2">
                <Navigation className="h-5 w-5 text-green-400" />
                <span className="text-green-300 font-medium">Data Source</span>
              </div>
              <div className="text-lg font-bold text-white">AviationStack</div>
            </div>
            
            <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-600/30">
              <div className="flex items-center gap-2 mb-2">
                <Fuel className="h-5 w-5 text-purple-400" />
                <span className="text-purple-300 font-medium">API Credits</span>
              </div>
              <div className="text-2xl font-bold text-white">{flightData.api_credits_used}</div>
            </div>
          </div>

          {/* Featured Flight */}
          {flightData.sample_flight && (
            <div className="bg-gray-800/50 rounded-lg border border-gray-600 p-6">
              <div className="flex items-center gap-3 mb-4">
                {getStatusIcon(flightData.sample_flight.status)}
                <h3 className="text-lg font-bold text-white">
                  Flight {flightData.sample_flight.flight_number}
                </h3>
                <span className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(flightData.sample_flight.status)} bg-gray-700`}>
                  {flightData.sample_flight.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Aircraft</div>
                  <div className="text-white font-medium">{flightData.sample_flight.aircraft}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-400 mb-1">Departure</div>
                  <div className="text-white font-medium">{flightData.sample_flight.departure}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-400 mb-1">Arrival</div>
                  <div className="text-white font-medium">{flightData.sample_flight.arrival}</div>
                </div>
                
                <div>
                  <div className="text-sm text-gray-400 mb-1">Status</div>
                  <div className={`font-medium ${getStatusColor(flightData.sample_flight.status)}`}>
                    {flightData.sample_flight.status}
                  </div>
                </div>
              </div>

              {/* Flight Position Data (if available) */}
              {(flightData.sample_flight.latitude || flightData.sample_flight.altitude) && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {flightData.sample_flight.latitude && (
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Latitude</div>
                        <div className="text-white font-medium">{flightData.sample_flight.latitude.toFixed(4)}°</div>
                      </div>
                    )}
                    
                    {flightData.sample_flight.longitude && (
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Longitude</div>
                        <div className="text-white font-medium">{flightData.sample_flight.longitude.toFixed(4)}°</div>
                      </div>
                    )}
                    
                    {flightData.sample_flight.altitude && (
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Altitude</div>
                        <div className="text-white font-medium">{flightData.sample_flight.altitude.toLocaleString()} ft</div>
                      </div>
                    )}
                    
                    {flightData.sample_flight.speed && (
                      <div>
                        <div className="text-sm text-gray-400 mb-1">Speed</div>
                        <div className="text-white font-medium">{flightData.sample_flight.speed} kts</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Real-time Data Indicator */}
          <div className="flex items-center justify-center gap-2 text-sm text-green-400">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span>Live data from AviationStack API</span>
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <Plane className="h-12 w-12 text-gray-600 mx-auto mb-4" />
          <div className="text-gray-400">
            {loading ? 'Loading live flight data...' : 'No flight data available'}
          </div>
        </div>
      )}
    </div>
  );
}