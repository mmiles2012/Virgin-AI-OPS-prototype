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
          <span className="text-white">Active Flights: <span className="text-green-400 font-bold">{flightData?.count || 0}</span></span>
          {lastUpdate && <span>Last Update: {formatTime(lastUpdate)}</span>}
          {loading && <span className="text-blue-400">Refreshing...</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-400 text-sm font-medium">Virgin Atlantic Live Tracking</span>
        </div>
      </div>

      {/* Data Debug Info */}
      {flightData && (
        <div className="mb-2 text-xs text-gray-500">
          API Response: {flightData.flights.length} flights at {new Date(flightData.timestamp).toLocaleTimeString()}
        </div>
      )}

      {/* World Map */}
      <div className="bg-gradient-to-b from-blue-900 to-blue-800 rounded-lg border border-gray-600 relative overflow-hidden" style={{ height: '400px', width: '800px' }}>
        {/* World Map Background with Continents */}
        <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
          {/* Ocean background */}
          <rect width="800" height="400" fill="#1e40af" />
          
          {/* North America */}
          <path d="M100,120 L200,100 L250,130 L280,160 L250,200 L180,220 L120,180 Z" fill="#065f46" opacity="0.7" />
          
          {/* South America */}
          <path d="M200,220 L250,240 L280,300 L260,350 L220,340 L200,280 Z" fill="#065f46" opacity="0.7" />
          
          {/* Europe */}
          <path d="M380,80 L420,90 L450,110 L430,140 L390,130 Z" fill="#065f46" opacity="0.7" />
          
          {/* Africa */}
          <path d="M380,140 L420,150 L450,200 L430,280 L400,290 L380,250 Z" fill="#065f46" opacity="0.7" />
          
          {/* Asia */}
          <path d="M450,80 L600,90 L650,120 L680,140 L650,180 L500,170 L450,130 Z" fill="#065f46" opacity="0.7" />
          
          {/* Australia */}
          <path d="M580,280 L650,290 L670,320 L640,340 L590,330 Z" fill="#065f46" opacity="0.7" />
          
          {/* Grid lines */}
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
              opacity="0.4"
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
              opacity="0.4"
            />
          ))}
          
          {/* Equator line */}
          <line x1="0" y1="200" x2="800" y2="200" stroke="#fbbf24" strokeWidth="2" opacity="0.6" />
          
          {/* Prime Meridian */}
          <line x1="400" y1="0" x2="400" y2="400" stroke="#fbbf24" strokeWidth="2" opacity="0.6" />
        </svg>

        {/* Flight Markers */}
        {flightData?.flights?.map((flight, index) => {
          const pos = getMapPosition(flight.latitude, flight.longitude);
          console.log(`Displaying flight ${flight.callsign} at position x:${pos.x}, y:${pos.y} (lat:${flight.latitude}, lon:${flight.longitude})`);
          
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
              {/* Flight marker - larger and more visible with heading alignment */}
              <div className="relative">
                <div 
                  className="w-6 h-6 bg-red-500 rounded-full border-4 border-yellow-400 shadow-lg animate-pulse flex items-center justify-center"
                  style={{
                    transform: `rotate(${(flight.heading || 0) - 90}deg)`,
                    fontSize: '16px',
                    color: '#fbbf24',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                    fontWeight: 'bold'
                  }}
                >
                  ⬆
                </div>
                <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-3 py-2 rounded text-sm whitespace-nowrap border border-yellow-400">
                  <div className="font-bold text-yellow-400">{flight.callsign}</div>
                  <div className="text-gray-300">{flight.aircraft}</div>
                  <div className="text-gray-400 text-xs">{Math.round(flight.altitude)}ft</div>
                  <div className="text-gray-400 text-xs">{Math.round(flight.velocity)}kts</div>
                  <div className="text-gray-400 text-xs">HDG: {Math.round(flight.heading || 0)}°</div>
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