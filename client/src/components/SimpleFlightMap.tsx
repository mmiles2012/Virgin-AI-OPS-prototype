import React, { useState, useEffect } from 'react';
import { Plane, Navigation, Wifi, RefreshCw } from 'lucide-react';

interface LiveFlight {
  callsign: string;
  aircraft: string;
  origin: string;
  destination: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
}

interface FlightData {
  flights: LiveFlight[];
  count: number;
  timestamp: string;
}

export default function SimpleFlightMap() {
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchFlightData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/aviation/virgin-atlantic-flights');
      const data = await response.json();
      
      if (data.success) {
        setFlightData(data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching flight data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFlightData();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(fetchFlightData, 15000);
    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Convert lat/lon to screen coordinates for world map
  const getMapPosition = (lat: number, lon: number) => {
    const mapWidth = 800;
    const mapHeight = 400;
    
    const x = ((lon + 180) / 360) * mapWidth;
    const y = ((90 - lat) / 180) * mapHeight;
    
    return { x, y };
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString();
  };

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700 p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Navigation className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Live Flight Tracking Map</h2>
          {loading && <Wifi className="h-4 w-4 text-blue-400 animate-pulse" />}
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
            {autoRefresh ? 'Live' : 'Manual'}
          </button>
          <button
            onClick={fetchFlightData}
            disabled={loading}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1"
          >
            <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="flex items-center gap-4 text-gray-400">
          <span>Flights: {flightData?.count || 0}</span>
          {lastUpdate && <span>Updated: {formatTime(lastUpdate)}</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-red-500 rounded-full"></div>
          <span className="text-red-500 text-xs">Virgin Atlantic Aircraft</span>
        </div>
      </div>

      {/* World Map */}
      <div className="bg-gradient-to-b from-blue-900 to-blue-800 rounded-lg border border-gray-600 relative overflow-hidden" style={{ height: '400px', width: '800px' }}>
        {/* Grid lines */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          {/* Longitude lines */}
          {Array.from({ length: 13 }, (_, i) => (
            <line
              key={`lon-${i}`}
              x1={(i * 800) / 12}
              y1={0}
              x2={(i * 800) / 12}
              y2={400}
              stroke="#374151"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
          {/* Latitude lines */}
          {Array.from({ length: 9 }, (_, i) => (
            <line
              key={`lat-${i}`}
              x1={0}
              y1={(i * 400) / 8}
              x2={800}
              y2={(i * 400) / 8}
              stroke="#374151"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
        </svg>

        {/* Flight Markers */}
        {flightData?.flights?.map((flight, index) => {
          const pos = getMapPosition(flight.latitude, flight.longitude);
          
          return (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2"
              style={{ 
                left: `${pos.x}px`, 
                top: `${pos.y}px`,
                zIndex: 10
              }}
            >
              {/* Flight marker */}
              <div className="relative">
                <div className="w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-2 py-1 rounded text-xs whitespace-nowrap">
                  <div className="font-bold text-yellow-400">{flight.callsign}</div>
                  <div className="text-gray-300">{flight.aircraft}</div>
                  <div className="text-gray-400 text-xs">{Math.round(flight.altitude)}ft</div>
                </div>
              </div>
            </div>
          );
        })}

        {/* World outline overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/20 via-transparent to-green-900/20" style={{ zIndex: 2 }}></div>
      </div>

      {/* Flight List */}
      {flightData?.flights && flightData.flights.length > 0 && (
        <div className="mt-4 bg-gray-800/50 rounded border border-gray-600 p-3 max-h-40 overflow-y-auto">
          <div className="flex items-center gap-2 mb-3">
            <Plane className="h-4 w-4 text-blue-400" />
            <span className="text-white font-medium">Live Virgin Atlantic Flights ({flightData.count})</span>
          </div>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            {flightData.flights.map((flight, index) => (
              <div key={index} className="bg-gray-700/50 rounded p-2">
                <div className="flex items-center justify-between">
                  <span className="text-yellow-400 font-medium">{flight.callsign}</span>
                  <span className="text-gray-300">{flight.aircraft}</span>
                </div>
                <div className="text-gray-400 text-xs mt-1">
                  {flight.origin} → {flight.destination}
                </div>
                <div className="text-gray-500 text-xs">
                  {flight.latitude.toFixed(2)}°, {flight.longitude.toFixed(2)}° | {Math.round(flight.altitude)}ft | {Math.round(flight.velocity)}kts
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}