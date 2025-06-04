import React, { useState, useEffect } from 'react';
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

      {/* Satellite Map Background */}
      <div 
        className="w-full h-full relative cursor-crosshair"
        onClick={handleMapClick}
        style={{
          backgroundImage: `url("data:image/svg+xml,${encodeURIComponent(`
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 500">
              <defs>
                <pattern id="grid" width="50" height="25" patternUnits="userSpaceOnUse">
                  <path d="M 50 0 L 0 0 0 25" fill="none" stroke="#374151" stroke-width="0.5" opacity="0.3"/>
                </pattern>
                <radialGradient id="earth" cx="50%" cy="30%">
                  <stop offset="0%" style="stop-color:#4ade80"/>
                  <stop offset="30%" style="stop-color:#22c55e"/>
                  <stop offset="70%" style="stop-color:#16a34a"/>
                  <stop offset="100%" style="stop-color:#166534"/>
                </radialGradient>
              </defs>
              
              <!-- Ocean background -->
              <rect width="1000" height="500" fill="#1e40af"/>
              
              <!-- Continental masses (simplified satellite view) -->
              <!-- North America -->
              <path d="M 100 120 L 250 100 L 300 140 L 320 180 L 280 220 L 200 240 L 120 200 Z" fill="url(#earth)" opacity="0.8"/>
              
              <!-- South America -->
              <path d="M 220 260 L 280 280 L 320 380 L 300 450 L 250 440 L 220 360 Z" fill="url(#earth)" opacity="0.8"/>
              
              <!-- Europe -->
              <path d="M 480 100 L 520 110 L 540 140 L 520 170 L 490 160 Z" fill="url(#earth)" opacity="0.8"/>
              
              <!-- Africa -->
              <path d="M 480 170 L 520 180 L 550 250 L 540 350 L 510 360 L 480 320 Z" fill="url(#earth)" opacity="0.8"/>
              
              <!-- Asia -->
              <path d="M 540 100 L 750 110 L 800 150 L 820 180 L 780 220 L 600 210 L 540 160 Z" fill="url(#earth)" opacity="0.8"/>
              
              <!-- Australia -->
              <path d="M 720 320 L 800 330 L 820 360 L 790 380 L 730 370 Z" fill="url(#earth)" opacity="0.8"/>
              
              <!-- Grid overlay -->
              <rect width="1000" height="500" fill="url(#grid)"/>
              
              <!-- Coordinate lines -->
              <line x1="0" y1="250" x2="1000" y2="250" stroke="#fbbf24" stroke-width="1" opacity="0.6"/>
              <line x1="500" y1="0" x2="500" y2="500" stroke="#fbbf24" stroke-width="1" opacity="0.6"/>
            </svg>
          `)}")`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          transform: `scale(${1 + (zoomLevel - 3) * 0.2}) translate(${(50 - mapCenter.lon) * 2}px, ${(mapCenter.lat - 40) * 3}px)`
        }}
      >
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