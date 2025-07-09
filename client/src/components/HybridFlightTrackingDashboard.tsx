import React, { useState, useEffect } from 'react';
import { Card, CardContent } from './ui/card';
import { Plane, Satellite, Calendar, MapPin, Clock, Signal, AlertTriangle } from 'lucide-react';

interface HybridFlightData {
  callsign: string;
  flight_number: string;
  registration?: string;
  aircraft_type: string;
  origin: string;
  destination: string;
  scheduled_departure?: string;
  scheduled_arrival?: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  last_contact?: number;
  status: string;
  flight_progress?: number;
  data_sources: {
    position: 'ADS-B' | 'FlightAware' | 'Fallback';
    schedule: 'FlightAware' | 'Fallback';
    route: 'FlightAware' | 'Fallback';
  };
  waypoints?: Array<{
    name: string;
    latitude: number;
    longitude: number;
    altitude: number;
    eta?: number;
  }>;
  data_quality: {
    position_accuracy: 'HIGH' | 'MEDIUM' | 'LOW';
    schedule_accuracy: 'HIGH' | 'MEDIUM' | 'LOW';
    last_updated: string;
  };
}

interface HybridFlightResponse {
  success: boolean;
  source: string;
  total_flights: number;
  flights: HybridFlightData[];
  data_quality_summary: {
    high_position_accuracy: number;
    high_schedule_accuracy: number;
    adsb_sourced: number;
    flightaware_sourced: number;
  };
  timestamp: string;
}

interface ServiceHealth {
  hybrid_service: string;
  data_sources: {
    flightaware: {
      status: string;
      message: string;
      authenticated: boolean;
    };
    adsb_exchange: {
      status: string;
      message: string;
      authenticated: boolean;
      flight_count?: number;
    };
  };
  integration_status: string;
  last_check: string;
}

const HybridFlightTrackingDashboard: React.FC = () => {
  const [flightData, setFlightData] = useState<HybridFlightResponse | null>(null);
  const [serviceHealth, setServiceHealth] = useState<ServiceHealth | null>(null);
  const [selectedFlight, setSelectedFlight] = useState<HybridFlightData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchHybridData = async () => {
    try {
      setLoading(true);
      const [flightResponse, healthResponse] = await Promise.all([
        fetch('/api/aviation/hybrid/virgin-atlantic'),
        fetch('/api/aviation/hybrid/health')
      ]);

      if (flightResponse.ok) {
        const flightData = await flightResponse.json();
        setFlightData(flightData);
      }

      if (healthResponse.ok) {
        const healthData = await healthResponse.json();
        setServiceHealth(healthData.hybrid_service_status);
      }

      setError(null);
    } catch (err) {
      setError('Failed to load hybrid flight data');
      console.error('Hybrid data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHybridData();
    const interval = setInterval(fetchHybridData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const getDataSourceIcon = (source: string) => {
    switch (source) {
      case 'ADS-B': return <Satellite className="w-4 h-4 text-blue-400" />;
      case 'FlightAware': return <Plane className="w-4 h-4 text-green-400" />;
      default: return <AlertTriangle className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getAccuracyColor = (accuracy: string) => {
    switch (accuracy) {
      case 'HIGH': return 'text-green-400';
      case 'MEDIUM': return 'text-yellow-400';
      case 'LOW': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusColor = (status: string) => {
    if (status === 'ok' || status === 'operational') return 'text-green-400';
    if (status === 'error') return 'text-red-400';
    return 'text-yellow-400';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="text-white text-lg">Loading Hybrid Flight Tracking System...</div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="bg-gray-800 border-gray-700">
              <CardContent className="p-4">
                <div className="animate-pulse bg-gray-700 h-6 rounded mb-3"></div>
                <div className="animate-pulse bg-gray-700 h-4 rounded mb-2"></div>
                <div className="animate-pulse bg-gray-700 h-4 rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Hybrid Flight Tracking System
          </h1>
          <p className="text-gray-300">
            Combining FlightAware AeroAPI and ADS-B Exchange for comprehensive Virgin Atlantic tracking
          </p>
        </div>
        <button
          onClick={fetchHybridData}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
        >
          Refresh Data
        </button>
      </div>

      {error && (
        <Card className="bg-red-900 border-red-700">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-red-300">
              <AlertTriangle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Health Status */}
      {serviceHealth && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Signal className="w-5 h-5" />
              Service Health Status
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="text-gray-300 text-sm">Hybrid Service</div>
                <div className={`font-semibold ${getStatusColor(serviceHealth.hybrid_service)}`}>
                  {serviceHealth.hybrid_service.toUpperCase()}
                </div>
                <div className="text-gray-400 text-xs">
                  Integration: {serviceHealth.integration_status}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-gray-300 text-sm">FlightAware AeroAPI</div>
                <div className={`font-semibold ${getStatusColor(serviceHealth.data_sources.flightaware.status)}`}>
                  {serviceHealth.data_sources.flightaware.status.toUpperCase()}
                </div>
                <div className="text-gray-400 text-xs">
                  {serviceHealth.data_sources.flightaware.authenticated ? 'Authenticated' : 'Not Authenticated'}
                </div>
              </div>
              <div className="space-y-2">
                <div className="text-gray-300 text-sm">ADS-B Exchange</div>
                <div className={`font-semibold ${getStatusColor(serviceHealth.data_sources.adsb_exchange.status)}`}>
                  {serviceHealth.data_sources.adsb_exchange.status.toUpperCase()}
                </div>
                <div className="text-gray-400 text-xs">
                  {serviceHealth.data_sources.adsb_exchange.flight_count} flights tracked
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Data Quality Summary */}
      {flightData && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Plane className="w-5 h-5" />
              Flight Data Quality Summary
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-400">
                  {flightData.total_flights}
                </div>
                <div className="text-gray-300 text-sm">Total Flights</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400">
                  {flightData.data_quality_summary.adsb_sourced}
                </div>
                <div className="text-gray-300 text-sm">ADS-B Position</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-400">
                  {flightData.data_quality_summary.flightaware_sourced}
                </div>
                <div className="text-gray-300 text-sm">FlightAware Schedule</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-400">
                  {flightData.data_quality_summary.high_position_accuracy}
                </div>
                <div className="text-gray-300 text-sm">High Accuracy</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Flight List */}
      {flightData && flightData.flights.length > 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Virgin Atlantic Flights ({flightData.flights.length})
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {flightData.flights.map((flight, index) => (
                <div
                  key={flight.callsign || index}
                  className={`p-4 border rounded-lg cursor-pointer transition-all ${
                    selectedFlight?.callsign === flight.callsign
                      ? 'bg-blue-900 border-blue-600'
                      : 'bg-gray-700 border-gray-600 hover:bg-gray-600'
                  }`}
                  onClick={() => setSelectedFlight(flight)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="font-semibold text-white">
                      {flight.flight_number} ({flight.aircraft_type})
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs px-2 py-1 rounded ${getAccuracyColor(flight.data_quality.position_accuracy)} bg-gray-800`}>
                        {flight.data_quality.position_accuracy}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-gray-300 text-sm mb-2">
                    {flight.origin} → {flight.destination}
                  </div>
                  
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <div className="flex items-center gap-1">
                      {getDataSourceIcon(flight.data_sources.position)}
                      <span>Position: {flight.data_sources.position}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getDataSourceIcon(flight.data_sources.schedule)}
                      <span>Schedule: {flight.data_sources.schedule}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
                    <div>
                      <span className="text-gray-400">Alt:</span>
                      <span className="text-white ml-1">{flight.altitude?.toLocaleString() || 'N/A'} ft</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Speed:</span>
                      <span className="text-white ml-1">{flight.velocity || 'N/A'} kts</span>
                    </div>
                    <div>
                      <span className="text-gray-400">Heading:</span>
                      <span className="text-white ml-1">{Math.round(flight.heading || 0)}°</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Flight Details */}
      {selectedFlight && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Flight Details: {selectedFlight.flight_number}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Flight Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Callsign:</span>
                      <span className="text-white">{selectedFlight.callsign}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Registration:</span>
                      <span className="text-white">{selectedFlight.registration || 'N/A'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Aircraft:</span>
                      <span className="text-white">{selectedFlight.aircraft_type}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Status:</span>
                      <span className="text-white">{selectedFlight.status}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Route Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Origin:</span>
                      <span className="text-white">{selectedFlight.origin}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Destination:</span>
                      <span className="text-white">{selectedFlight.destination}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Progress:</span>
                      <span className="text-white">{selectedFlight.flight_progress || 'N/A'}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-white mb-2">Current Position</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Latitude:</span>
                      <span className="text-white">{selectedFlight.latitude?.toFixed(4)}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Longitude:</span>
                      <span className="text-white">{selectedFlight.longitude?.toFixed(4)}°</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Altitude:</span>
                      <span className="text-white">{selectedFlight.altitude?.toLocaleString() || 'N/A'} ft</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Ground Speed:</span>
                      <span className="text-white">{selectedFlight.velocity || 'N/A'} kts</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Heading:</span>
                      <span className="text-white">{Math.round(selectedFlight.heading || 0)}°</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold text-white mb-2">Data Sources</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Position Data:</span>
                      <div className="flex items-center gap-1">
                        {getDataSourceIcon(selectedFlight.data_sources.position)}
                        <span className="text-white">{selectedFlight.data_sources.position}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Schedule Data:</span>
                      <div className="flex items-center gap-1">
                        {getDataSourceIcon(selectedFlight.data_sources.schedule)}
                        <span className="text-white">{selectedFlight.data_sources.schedule}</span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Route Data:</span>
                      <div className="flex items-center gap-1">
                        {getDataSourceIcon(selectedFlight.data_sources.route)}
                        <span className="text-white">{selectedFlight.data_sources.route}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {selectedFlight.waypoints && selectedFlight.waypoints.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold text-white mb-2">Route Waypoints</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                  {selectedFlight.waypoints.slice(0, 8).map((waypoint, index) => (
                    <div key={index} className="bg-gray-700 p-2 rounded">
                      <div className="font-semibold text-white">{waypoint.name}</div>
                      <div className="text-gray-400">
                        {waypoint.latitude.toFixed(2)}°, {waypoint.longitude.toFixed(2)}°
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {flightData && flightData.flights.length === 0 && (
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6 text-center">
            <Plane className="w-12 h-12 text-gray-500 mx-auto mb-4" />
            <div className="text-gray-300">No Virgin Atlantic flights currently tracked</div>
            <div className="text-gray-500 text-sm mt-2">
              The hybrid system combines FlightAware and ADS-B data when flights are available
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default HybridFlightTrackingDashboard;