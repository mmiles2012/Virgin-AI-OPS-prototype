import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Satellite, Plane } from 'lucide-react';
import { useSelectedFlight } from '../lib/stores/useSelectedFlight';

interface FlightPosition {
  callsign: string;
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  heading: number;
  aircraft: string;
  origin?: string;
  destination?: string;
}

export default function SatelliteWorldMap() {
  const [flightData, setFlightData] = useState<FlightPosition[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 40, lon: 0 }); // Center on Europe/Atlantic
  const [zoomLevel, setZoomLevel] = useState(3);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Optimized satellite imagery state
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const imageCache = useRef(new Map<string, HTMLImageElement>());
  const debounceTimer = useRef<NodeJS.Timeout>();
  
  // Flight selection state
  const { selectFlight, selectedFlight } = useSelectedFlight();

  // Generate optimized image URL with coordinate rounding and caching
  const generateImageUrl = (lat: number, lon: number, zoom: number, token: string) => {
    const roundedLat = Math.round(lat * 1000) / 1000; // Round to 3 decimal places for precision
    const roundedLon = Math.round(lon * 1000) / 1000;
    const clampedZoom = Math.max(1, Math.min(zoom, 10));
    
    return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${roundedLon},${roundedLat},${clampedZoom}/1200x800@2x?access_token=${token}`;
  };

  // Debounced image loading function
  const loadSatelliteImage = (lat: number, lon: number, zoom: number, token: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const imageUrl = generateImageUrl(lat, lon, zoom, token);
      
      // Check cache first
      if (imageCache.current.has(imageUrl)) {
        setCurrentImageUrl(imageUrl);
        setImageLoading(false);
        setImageError(false);
        return;
      }

      setImageLoading(true);
      setImageError(false);

      // Preload image
      const img = new Image();
      img.onload = () => {
        imageCache.current.set(imageUrl, img);
        setCurrentImageUrl(imageUrl);
        setImageLoading(false);
        setImageError(false);
        console.log('Satellite image loaded successfully');
      };
      
      img.onerror = () => {
        console.error('Satellite image failed to load:', imageUrl);
        setImageLoading(false);
        setImageError(true);
      };
      
      img.src = imageUrl;
    }, 300); // 300ms debounce
  };

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

  // Load satellite imagery when mapCenter, zoomLevel, or token changes
  useEffect(() => {
    if (mapboxToken) {
      loadSatelliteImage(mapCenter.lat, mapCenter.lon, zoomLevel, mapboxToken);
    }
  }, [mapCenter.lat, mapCenter.lon, zoomLevel, mapboxToken]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
      imageCache.current.clear();
    };
  }, []);

  useEffect(() => {
    const fetchFlightData = async () => {
      try {
        // Try Virgin Atlantic flights with training mode fallback
        const response = await fetch('/api/aviation/virgin-atlantic-flights?training_mode=true');
        const data = await response.json();
        
        if (data.success && data.flights && data.flights.length > 0) {
          setFlightData(data.flights);
          
          // Center map on first flight if available
          setMapCenter({
            lat: data.flights[0].latitude,
            lon: data.flights[0].longitude
          });
        } else {
          // If Virgin Atlantic API fails, try live aircraft data
          const liveResponse = await fetch('/api/aviation/live-aircraft?latMin=25&latMax=70&lonMin=-180&lonMax=30&limit=20');
          const liveData = await liveResponse.json();
          
          if (liveData.success && liveData.aircraft && liveData.aircraft.length > 0) {
            setFlightData(liveData.aircraft);
            
            // Center map on first aircraft
            setMapCenter({
              lat: liveData.aircraft[0].latitude,
              lon: liveData.aircraft[0].longitude
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

  // Convert lat/lon to pixel coordinates using Web Mercator projection (EPSG:3857) matching Mapbox
  const latLonToPixel = (lat: number, lon: number, containerWidth: number, containerHeight: number) => {
    // Web Mercator projection calculations
    const EARTH_RADIUS = 6378137; // Earth's radius in meters
    const ORIGIN_SHIFT = 2 * Math.PI * EARTH_RADIUS / 2.0;
    
    // Convert center coordinates to Web Mercator
    const centerX = mapCenter.lon * ORIGIN_SHIFT / 180.0;
    const centerY = Math.log(Math.tan((90 + mapCenter.lat) * Math.PI / 360.0)) / (Math.PI / 180.0);
    const centerYMercator = centerY * ORIGIN_SHIFT / 180.0;
    
    // Convert flight coordinates to Web Mercator
    const flightX = lon * ORIGIN_SHIFT / 180.0;
    const flightY = Math.log(Math.tan((90 + lat) * Math.PI / 360.0)) / (Math.PI / 180.0);
    const flightYMercator = flightY * ORIGIN_SHIFT / 180.0;
    
    // Calculate the scale factor based on zoom level
    const scale = Math.pow(2, zoomLevel);
    const pixelsPerMeter = scale * 256 / (2 * ORIGIN_SHIFT);
    
    // Calculate pixel offsets from center
    const deltaX = (flightX - centerX) * pixelsPerMeter;
    const deltaY = (centerYMercator - flightYMercator) * pixelsPerMeter; // Y is inverted in screen coordinates
    
    // Convert to screen coordinates
    const x = containerWidth / 2 + deltaX;
    const y = containerHeight / 2 + deltaY;
    
    return { 
      x: Math.round(x), 
      y: Math.round(y) 
    };
  };

  // Mouse drag handlers
  const handleMouseDown = (event: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setDragStart({ x: event.clientX, y: event.clientY });
    event.preventDefault();
  };

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    
    const deltaX = event.clientX - dragStart.x;
    const deltaY = event.clientY - dragStart.y;
    
    // Improved sensitivity calculation based on zoom level and Web Mercator scale
    const baseScale = Math.pow(2, zoomLevel);
    const metersPerPixel = (2 * 20037508.34) / (256 * baseScale);
    const degreesPerPixel = metersPerPixel / 111319.5; // Approximate meters per degree at equator
    
    const newLon = mapCenter.lon - deltaX * degreesPerPixel;
    const newLat = mapCenter.lat + deltaY * degreesPerPixel * Math.cos(mapCenter.lat * Math.PI / 180);
    
    // Allow full global navigation with proper wrapping
    setMapCenter({
      lat: Math.max(-85, Math.min(85, newLat)),
      lon: newLon > 180 ? newLon - 360 : newLon < -180 ? newLon + 360 : newLon
    });
    
    setDragStart({ x: event.clientX, y: event.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Mouse wheel zoom handler
  const handleWheel = (event: React.WheelEvent<HTMLDivElement>) => {
    event.preventDefault();
    const delta = event.deltaY > 0 ? -1 : 1;
    const newZoom = Math.max(1, Math.min(8, zoomLevel + delta));
    setZoomLevel(newZoom);
  };

  // Touch handlers for mobile
  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: event.touches[0].clientX, y: event.touches[0].clientY });
    }
    event.preventDefault();
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || event.touches.length !== 1) return;
    
    const deltaX = event.touches[0].clientX - dragStart.x;
    const deltaY = event.touches[0].clientY - dragStart.y;
    
    const sensitivity = 0.05 / Math.pow(1.5, zoomLevel - 3);
    const newLon = mapCenter.lon - deltaX * sensitivity;
    const newLat = mapCenter.lat + deltaY * sensitivity;
    
    setMapCenter({
      lat: Math.max(-85, Math.min(85, newLat)),
      lon: newLon > 180 ? newLon - 360 : newLon < -180 ? newLon + 360 : newLon
    });
    
    setDragStart({ x: event.touches[0].clientX, y: event.touches[0].clientY });
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Smooth keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const moveAmount = 2 / Math.pow(1.5, zoomLevel - 3);
      
      switch (event.key) {
        case 'ArrowUp':
          setMapCenter(prev => ({ ...prev, lat: Math.min(85, prev.lat + moveAmount) }));
          break;
        case 'ArrowDown':
          setMapCenter(prev => ({ ...prev, lat: Math.max(-85, prev.lat - moveAmount) }));
          break;
        case 'ArrowLeft':
          setMapCenter(prev => ({ 
            ...prev, 
            lon: prev.lon - moveAmount < -180 ? prev.lon - moveAmount + 360 : prev.lon - moveAmount
          }));
          break;
        case 'ArrowRight':
          setMapCenter(prev => ({ 
            ...prev, 
            lon: prev.lon + moveAmount > 180 ? prev.lon + moveAmount - 360 : prev.lon + moveAmount
          }));
          break;
        case '+':
        case '=':
          event.preventDefault();
          setZoomLevel(prev => Math.min(8, prev + 1));
          break;
        case '-':
          event.preventDefault();
          setZoomLevel(prev => Math.max(1, prev - 1));
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomLevel]);

  // Global mouse up handler for drag operations
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* AINO Header - Top Center */}
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm rounded-lg border border-gray-600 p-3 z-20">
        <div className="flex items-center gap-3">
          <Satellite className="h-5 w-5 text-blue-400" />
          <h3 className="text-white font-medium">AINO - Global Flight Operations</h3>
          <div className="text-sm text-gray-400">
            {flightData.length} active flights
          </div>
        </div>
      </div>

      {/* Real Satellite Map Background */}
      <div 
        ref={mapContainerRef}
        className={`w-full h-full relative overflow-hidden select-none transition-transform duration-150 ease-out ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          backgroundColor: '#0f172a'
        }}
      >
        {/* Optimized Satellite Background */}
        {mapboxToken && (
          <div className="absolute inset-0 w-full h-full">
            {/* Loading state */}
            {imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                <div className="text-white text-center">
                  <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <div className="text-sm">Loading satellite imagery...</div>
                </div>
              </div>
            )}
            
            {/* Error state */}
            {imageError && !imageLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-white text-center">
                  <div className="text-red-400 text-lg mb-2">⚠</div>
                  <div className="text-sm">Satellite imagery unavailable</div>
                </div>
              </div>
            )}
            
            {/* Main satellite image */}
            {currentImageUrl && !imageError && (
              <div 
                className="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat transition-opacity duration-500"
                style={{
                  backgroundImage: `url("${currentImageUrl}")`,
                  transform: `scale(${Math.pow(1.3, zoomLevel - 3)})`,
                  transformOrigin: 'center center',
                  opacity: imageLoading ? 0.3 : 1
                }}
              />
            )}
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
          

        </svg>
        {/* Flight Markers */}
        {/* Real-time Virgin Atlantic Flight Tracking */}
        {flightData.map((flight, index) => {
          const position = latLonToPixel(flight.latitude, flight.longitude, 1000, 500);
          const headingRotation = flight.heading || 0;
          
          return (
            <div
              key={flight.callsign || index}
              className="absolute transform -translate-x-1/2 -translate-y-1/2 z-10"
              style={{
                left: `${(position.x / 1000) * 100}%`,
                top: `${(position.y / 500) * 100}%`,
              }}
            >
              {/* Virgin Atlantic Aircraft marker with heading */}
              <div 
                className="relative group cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation();
                  selectFlight(flight);
                  console.log('Selected flight for operations center:', flight.callsign);
                }}
              >
                {/* Flight path trail */}
                <div 
                  className="absolute w-16 h-0.5 bg-red-400/40"
                  style={{
                    left: '50%',
                    top: '50%',
                    transform: `translate(-50%, -50%) rotate(${headingRotation}deg)`,
                    transformOrigin: 'left center'
                  }}
                />
                
                {/* Aircraft icon with Virgin Atlantic styling */}
                <div 
                  className={`w-5 h-5 rounded-full border-2 shadow-lg flex items-center justify-center transition-all duration-300 ${
                    selectedFlight?.callsign === flight.callsign 
                      ? 'bg-yellow-500 border-yellow-300 scale-125 animate-pulse' 
                      : 'bg-red-600 border-white hover:bg-red-500 hover:scale-110'
                  }`}
                  style={{
                    transform: `${selectedFlight?.callsign === flight.callsign ? 'scale(1.25)' : 'scale(1)'}`
                  }}
                >
                  <div 
                    className="w-3 h-3 text-white flex items-center justify-center font-bold" 
                    style={{ 
                      transform: `rotate(${headingRotation - 90}deg)`,
                      fontSize: '12px'
                    }}
                  >
                    ▶
                  </div>
                </div>
                
                {/* Enhanced flight info tooltip */}
                <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 bg-red-900/95 backdrop-blur-sm text-white px-4 py-3 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity border border-red-600/50 shadow-xl z-30 min-w-72">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></div>
                    <div className="font-bold text-red-300 text-sm">{flight.callsign}</div>
                    <div className="text-red-400 text-xs font-medium">VIRGIN ATLANTIC</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-red-300 font-medium mb-1">Aircraft</div>
                      <div className="text-white">{flight.aircraft}</div>
                    </div>
                    <div>
                      <div className="text-red-300 font-medium mb-1">Altitude</div>
                      <div className="text-white">{flight.altitude?.toLocaleString() || 'N/A'} ft</div>
                    </div>
                    <div>
                      <div className="text-red-300 font-medium mb-1">Ground Speed</div>
                      <div className="text-white">{flight.velocity?.toFixed(0) || 'N/A'} kt</div>
                    </div>
                    <div>
                      <div className="text-red-300 font-medium mb-1">Heading</div>
                      <div className="text-white">{flight.heading?.toFixed(0) || 'N/A'}°</div>
                    </div>
                  </div>
                  
                  {(flight.origin || flight.destination) && (
                    <div className="mt-3 pt-2 border-t border-red-700/50">
                      {flight.origin && (
                        <div className="text-xs mb-1">
                          <span className="text-red-300 font-medium">Origin:</span> 
                          <span className="text-white ml-1">{flight.origin}</span>
                        </div>
                      )}
                      {flight.destination && (
                        <div className="text-xs">
                          <span className="text-red-300 font-medium">Destination:</span> 
                          <span className="text-white ml-1">{flight.destination}</span>
                        </div>
                      )}
                    </div>
                  )}
                  
                  <div className="mt-2 pt-2 border-t border-red-700/50 text-xs text-red-400">
                    Position: {flight.latitude.toFixed(4)}°N, {flight.longitude.toFixed(4)}°E
                  </div>
                  
                  {/* Tooltip arrow */}
                  <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-red-900/95"></div>
                  </div>
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

      {/* Map Coordinates - Bottom Left */}
      <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-300 border border-gray-600">
        <div className="mb-2 font-medium text-white">Current Position</div>
        <div>Lat: {mapCenter.lat.toFixed(4)}°</div>
        <div>Lon: {mapCenter.lon.toFixed(4)}°</div>
        <div className="mt-2 text-gray-400 text-xs">
          Drag • Scroll • Arrow keys
        </div>
      </div>

      {/* Real-time Flight Legend */}
      <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-3 text-xs text-gray-300 border border-gray-600">
        <div className="mb-2 font-medium text-white flex items-center gap-2">
          <Plane className="h-4 w-4 text-red-500" />
          Live Flight Tracking
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-600 rounded-full border-2 border-white flex items-center justify-center">
              <Plane className="w-2 h-2 text-white" />
            </div>
            <span>Virgin Atlantic Aircraft</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-0.5 bg-red-400/40"></div>
            <span>Flight Path</span>
          </div>
          <div className="text-red-400 text-xs font-medium">
            {flightData.length} active flight{flightData.length !== 1 ? 's' : ''}
          </div>
          <div className="text-gray-400 text-xs">
            Real-time data • Hover for details
          </div>
        </div>
      </div>
    </div>
  );
}