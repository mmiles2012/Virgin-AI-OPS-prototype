import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Satellite, Plane } from 'lucide-react';

interface FlightPosition {
  callsign: string;
  latitude: number;
  longitude: number;
  altitude: number;
  aircraft: string;
}

export default function SatelliteWorldMap() {
  const [flightData, setFlightData] = useState<FlightPosition[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 40, lon: 0 }); // Center on Europe/Atlantic
  const [zoomLevel, setZoomLevel] = useState(3);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  // Fetch Mapbox token from environment
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const response = await fetch('/api/config/mapbox');
        if (response.ok) {
          const data = await response.json();
          setMapboxToken(data.token);
        }
      } catch (error) {
        console.error('Error fetching Mapbox token:', error);
      }
    };
    
    fetchMapboxToken();
  }, []);

  useEffect(() => {
    const fetchFlightData = async () => {
      try {
        const response = await fetch('/api/aviation/virgin-atlantic-flights');
        const data = await response.json();
        
        if (data.success && data.flights) {
          setFlightData(data.flights);
          
          // Center map on first flight if available
          if (data.flights.length > 0) {
            setMapCenter({
              lat: data.flights[0].latitude,
              lon: data.flights[0].longitude
            });
          }
        }
      } catch (error) {
        console.error('Error fetching flight data:', error);
      }
    };

    fetchFlightData();
    const interval = setInterval(fetchFlightData, 30000);
    return () => clearInterval(interval);
  }, []);

  // Convert lat/lon to pixel coordinates for the map container
  const latLonToPixel = (lat: number, lon: number, containerWidth: number, containerHeight: number) => {
    // Simple equirectangular projection
    const x = ((lon + 180) / 360) * containerWidth;
    const y = ((90 - lat) / 180) * containerHeight;
    return { x, y };
  };

  const handleMapClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    
    // Convert pixel coordinates back to lat/lon
    const lon = (x / rect.width) * 360 - 180;
    const lat = 90 - (y / rect.height) * 180;
    
    setMapCenter({ lat, lon });
  };

  return (
    <div className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden border border-gray-600">
      {/* Map Header */}
      <div className="absolute top-0 left-0 right-0 bg-black/80 backdrop-blur-sm p-3 z-20 border-b border-gray-600">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Satellite className="h-5 w-5 text-blue-400" />
            <h3 className="text-white font-medium">Global Flight Operations View</h3>
            <div className="text-sm text-gray-400">
              {flightData.length} active flights
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <span>Zoom: {zoomLevel}</span>
            <button
              onClick={() => setZoomLevel(Math.max(1, zoomLevel - 1))}
              className="px-2 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600"
            >
              -
            </button>
            <button
              onClick={() => setZoomLevel(Math.min(8, zoomLevel + 1))}
              className="px-2 py-1 bg-gray-700 text-white rounded text-xs hover:bg-gray-600"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Real Satellite Map Background */}
      <div 
        ref={mapContainerRef}
        className="w-full h-full relative cursor-crosshair overflow-hidden"
        onClick={handleMapClick}
        style={{
          backgroundColor: '#0f172a'
        }}
      >
        {/* Mapbox Satellite Tiles Grid */}
        {mapboxToken && (
          <div 
            className="absolute inset-0"
            style={{
              transform: `scale(${1 + (zoomLevel - 3) * 0.3}) translate(${(50 - mapCenter.lon) * 4}px, ${(mapCenter.lat - 40) * 4}px)`,
              transformOrigin: 'center center'
            }}
          >
            {/* Create a grid of satellite tiles for global coverage */}
            {Array.from({ length: Math.pow(2, Math.min(zoomLevel, 6)) }, (_, tileX) =>
              Array.from({ length: Math.pow(2, Math.min(zoomLevel, 6)) }, (_, tileY) => {
                const tileSize = 512;
                const tilesPerRow = Math.pow(2, Math.min(zoomLevel, 6));
                
                return (
                  <div
                    key={`${tileX}-${tileY}`}
                    className="absolute"
                    style={{
                      left: `${(tileX * tileSize) - (tilesPerRow * tileSize) / 2}px`,
                      top: `${(tileY * tileSize) - (tilesPerRow * tileSize) / 2}px`,
                      width: `${tileSize}px`,
                      height: `${tileSize}px`,
                      backgroundImage: `url("https://api.mapbox.com/styles/v1/mapbox/satellite-v9/tiles/512/${Math.min(zoomLevel, 6)}/${tileX}/${tileY}@2x?access_token=${mapboxToken}")`,
                      backgroundSize: 'cover',
                      backgroundRepeat: 'no-repeat'
                    }}
                  />
                );
              })
            ).flat()}
          </div>
        )}
        
        {/* Fallback gradient if no Mapbox token */}
        {!mapboxToken && (
          <div 
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(135deg, #1e40af 0%, #1e3a8a 50%, #0f172a 100%)'
            }}
          >
            <div className="absolute inset-0 opacity-20">
              <div className="w-full h-full bg-gradient-to-r from-green-900/30 via-transparent to-green-900/30"></div>
            </div>
          </div>
        )}

        {/* Coordinate Grid Overlay */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
          {/* Longitude lines */}
          {Array.from({ length: 13 }, (_, i) => (
            <line
              key={`lon-${i}`}
              x1={`${(i * 100) / 12}%`}
              y1="0%"
              x2={`${(i * 100) / 12}%`}
              y2="100%"
              stroke="#374151"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
          {/* Latitude lines */}
          {Array.from({ length: 9 }, (_, i) => (
            <line
              key={`lat-${i}`}
              x1="0%"
              y1={`${(i * 100) / 8}%`}
              x2="100%"
              y2={`${(i * 100) / 8}%`}
              stroke="#374151"
              strokeWidth="1"
              opacity="0.3"
            />
          ))}
          
          {/* Equator line */}
          <line x1="0%" y1="50%" x2="100%" y2="50%" stroke="#fbbf24" strokeWidth="2" opacity="0.6" />
          
          {/* Prime Meridian */}
          <line x1="50%" y1="0%" x2="50%" y2="100%" stroke="#fbbf24" strokeWidth="2" opacity="0.6" />
        </svg>
        {/* Flight Markers */}
        {flightData.map((flight, index) => {
          const position = latLonToPixel(flight.latitude, flight.longitude, 1000, 500);
          
          return (
            <div
              key={index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{
                left: `${(position.x / 1000) * 100}%`,
                top: `${(position.y / 500) * 100}%`,
              }}
            >
              {/* Aircraft marker */}
              <div className="relative group">
                <div className="w-3 h-3 bg-red-500 rounded-full border-2 border-yellow-400 animate-pulse shadow-lg"></div>
                
                {/* Flight info tooltip */}
                <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2 bg-black/90 text-white px-3 py-2 rounded text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-yellow-400 z-20">
                  <div className="font-bold text-yellow-400">{flight.callsign}</div>
                  <div className="text-gray-300">{flight.aircraft}</div>
                  <div className="text-gray-400">{Math.round(flight.altitude)} ft</div>
                  <div className="text-gray-500 text-xs">
                    {flight.latitude.toFixed(2)}°, {flight.longitude.toFixed(2)}°
                  </div>
                  
                  {/* Arrow pointing to marker */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-yellow-400"></div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Map Center Crosshair */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 pointer-events-none z-15"
          style={{
            left: '50%',
            top: '50%',
          }}
        >
          <div className="w-8 h-8 border border-blue-400 rounded-full bg-blue-400/20"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-0.5 bg-blue-400"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-0.5 h-4 bg-blue-400"></div>
        </div>
      </div>

      {/* Map Controls */}
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-300 border border-gray-600">
        <div className="mb-2 font-medium text-white">Map Center</div>
        <div>Lat: {mapCenter.lat.toFixed(4)}°</div>
        <div>Lon: {mapCenter.lon.toFixed(4)}°</div>
        <div className="mt-2 text-gray-400">Click to recenter</div>
      </div>

      {/* Flight Legend */}
      <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-300 border border-gray-600">
        <div className="mb-2 font-medium text-white flex items-center gap-2">
          <Plane className="h-4 w-4" />
          Active Flights
        </div>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
          <span>Virgin Atlantic</span>
        </div>
        <div className="text-gray-400">Hover for details</div>
      </div>
    </div>
  );
}