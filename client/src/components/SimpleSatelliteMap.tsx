import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Satellite, Plane, Sun, Moon, Cloud, CloudRain, Wind, Navigation, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
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

interface WeatherData {
  temperature: number;
  windSpeed: number;
  windDirection: number;
  visibility: number;
  conditions: string;
  cloudCover: number;
  precipitation: number;
}

export default function SimpleSatelliteMap() {
  const [flightData, setFlightData] = useState<FlightPosition[]>([]);
  const [mapCenter, setMapCenter] = useState({ lat: 40, lon: 0 });
  const [zoomLevel, setZoomLevel] = useState(3);
  const [mapboxToken, setMapboxToken] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  
  // Enhanced features state
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showDayNightOverlay, setShowDayNightOverlay] = useState(true);
  const [showWeatherLayer, setShowWeatherLayer] = useState(true);
  const [showFlightPaths, setShowFlightPaths] = useState(true);
  const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({});
  
  // Navigation presets
  const navigationPresets = [
    { name: 'London', lat: 51.4769, lon: -0.4614, zoom: 8, description: 'Heathrow Hub' },
    { name: 'New York', lat: 40.6413, lon: -73.7781, zoom: 8, description: 'JFK Airport' },
    { name: 'Atlantic', lat: 45, lon: -30, zoom: 4, description: 'North Atlantic Corridor' },
    { name: 'Caribbean', lat: 18.4, lon: -66.0, zoom: 6, description: 'Caribbean Routes' },
    { name: 'Mediterranean', lat: 35.0, lon: 18.0, zoom: 5, description: 'Med Basin' },
    { name: 'Global', lat: 20, lon: 0, zoom: 2, description: 'World Overview' }
  ];
  
  const { selectFlight, selectedFlight } = useSelectedFlight();

  // Generate simple, reliable Mapbox URL
  const generateMapboxUrl = useCallback((lat: number, lon: number, zoom: number, token: string) => {
    const clampedLat = Math.max(-85, Math.min(85, lat));
    const clampedLon = Math.max(-180, Math.min(180, lon));
    const clampedZoom = Math.max(1, Math.min(zoom, 18));
    
    return `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${clampedLon},${clampedLat},${clampedZoom}/1200x800@2x?access_token=${token}`;
  }, []);

  // Calculate day/night information
  const calculateDayNight = useCallback(() => {
    const hour = currentTime.getUTCHours();
    const isDaytime = hour >= 6 && hour < 18;
    const twilightLevel = isDaytime ? 0.8 : 0.2;
    
    return { isDaytime, twilightLevel };
  }, [currentTime]);

  // Fetch weather data for a location
  const fetchWeatherData = useCallback(async (lat: number, lon: number) => {
    try {
      const response = await fetch(`/api/weather/current/${lat.toFixed(2)}/${lon.toFixed(2)}`);
      const data = await response.json();
      
      if (data.success) {
        return {
          temperature: data.weather.temperature,
          windSpeed: data.weather.windSpeed,
          windDirection: data.weather.windDirection,
          visibility: data.weather.visibility,
          conditions: data.weather.conditions,
          cloudCover: data.weather.cloudCover,
          precipitation: data.weather.precipitation
        };
      }
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
    }
    
    return null;
  }, []);

  // Load weather grid - positioned based on zoom level for better coverage
  const loadWeatherGrid = useCallback(async () => {
    if (!showWeatherLayer) return;
    
    const newWeatherData: Record<string, WeatherData> = {};
    
    // Calculate grid spacing based on zoom level
    const latSpacing = Math.max(5, 30 / zoomLevel);
    const lonSpacing = Math.max(10, 60 / zoomLevel);
    
    // Create a 3x3 grid around the current center
    const gridPoints = [];
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        gridPoints.push({
          lat: mapCenter.lat + (i * latSpacing),
          lon: mapCenter.lon + (j * lonSpacing)
        });
      }
    }
    
    for (const point of gridPoints) {
      const key = `${point.lat.toFixed(1)}_${point.lon.toFixed(1)}`;
      if (!weatherData[key]) {
        const weather = await fetchWeatherData(point.lat, point.lon);
        if (weather) {
          newWeatherData[key] = weather;
        }
      }
    }
    
    setWeatherData(prev => ({ ...prev, ...newWeatherData }));
  }, [mapCenter, zoomLevel, showWeatherLayer, weatherData, fetchWeatherData]);

  // Accurate coordinate conversion for Mapbox static images
  const latLonToPixel = useCallback((lat: number, lon: number) => {
    if (!mapContainerRef.current) return { x: 0, y: 0 };
    
    const containerRect = mapContainerRef.current.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;
    
    // Mapbox static image dimensions and zoom calculation
    const imageWidth = 1200;
    const imageHeight = 800;
    
    // Calculate the degree span shown in the static image
    const degreesPerTile = 360 / Math.pow(2, zoomLevel);
    const imageDegreesLon = degreesPerTile * (imageWidth / 256);
    const imageDegreesLat = degreesPerTile * (imageHeight / 256);
    
    // Calculate position relative to image bounds
    const leftBound = mapCenter.lon - imageDegreesLon / 2;
    const rightBound = mapCenter.lon + imageDegreesLon / 2;
    const topBound = mapCenter.lat + imageDegreesLat / 2;
    const bottomBound = mapCenter.lat - imageDegreesLat / 2;
    
    // Convert to pixel coordinates within the displayed image
    const xRatio = (lon - leftBound) / (rightBound - leftBound);
    const yRatio = (topBound - lat) / (topBound - bottomBound);
    
    // Map to screen coordinates
    const x = xRatio * width + dragOffset.x;
    const y = yRatio * height + dragOffset.y;
    
    return { x, y };
  }, [mapCenter, zoomLevel, dragOffset]);

  // Navigation functions
  const handlePresetNavigation = (preset: typeof navigationPresets[0]) => {
    setMapCenter({ lat: preset.lat, lon: preset.lon });
    setZoomLevel(preset.zoom);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 1, 18));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 1, 1));
  const handleResetView = () => {
    setMapCenter({ lat: 40, lon: 0 });
    setZoomLevel(3);
    setDragOffset({ x: 0, y: 0 });
  };

  // Mouse interaction handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setDragOffset({ x: deltaX, y: deltaY });
  };

  const handleMouseUp = () => {
    if (isDragging) {
      const sensitivity = 0.001 * (20 - zoomLevel);
      setMapCenter(prev => ({
        lat: prev.lat + (dragOffset.y * sensitivity),
        lon: prev.lon - (dragOffset.x * sensitivity)
      }));
      setDragOffset({ x: 0, y: 0 });
    }
    setIsDragging(false);
  };

  // Initialize systems
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const response = await fetch('/api/config/mapbox');
        const data = await response.json();
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Failed to fetch Mapbox token:', error);
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
        }
      } catch (error) {
        console.error('Failed to fetch flight data:', error);
      }
    };
    
    fetchFlightData();
    const interval = setInterval(fetchFlightData, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    
    return () => clearInterval(timeInterval);
  }, []);

  useEffect(() => {
    if (showWeatherLayer) {
      loadWeatherGrid();
    }
  }, [mapCenter, showWeatherLayer, loadWeatherGrid]);

  const dayNight = calculateDayNight();
  const currentImageUrl = mapboxToken ? generateMapboxUrl(mapCenter.lat, mapCenter.lon, zoomLevel, mapboxToken) : '';

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900">
      {/* Navigation Panel */}
      <div className="absolute top-4 left-4 z-20 space-y-4">
        <Card className="w-80 bg-black/80 backdrop-blur-sm border-gray-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Satellite className="h-5 w-5" />
              Satellite Navigation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Quick Navigation */}
            <div>
              <h4 className="text-white text-sm font-medium mb-2">Quick Navigation</h4>
              <div className="grid grid-cols-2 gap-2">
                {navigationPresets.map((preset) => (
                  <Button
                    key={preset.name}
                    variant="outline"
                    size="sm"
                    onClick={() => handlePresetNavigation(preset)}
                    className="text-xs text-white border-gray-600 hover:bg-gray-700"
                    title={preset.description}
                  >
                    {preset.name}
                  </Button>
                ))}
              </div>
            </div>
            
            {/* Zoom Controls */}
            <div>
              <h4 className="text-white text-sm font-medium mb-2">Zoom Level: {zoomLevel}</h4>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleZoomOut} disabled={zoomLevel <= 1}>
                  <ZoomOut className="h-4 w-4" />
                </Button>
                <Slider
                  value={[zoomLevel]}
                  onValueChange={(value) => setZoomLevel(value[0])}
                  min={1}
                  max={18}
                  step={1}
                  className="flex-1"
                />
                <Button size="sm" variant="outline" onClick={handleZoomIn} disabled={zoomLevel >= 18}>
                  <ZoomIn className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="outline" onClick={handleResetView}>
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Layer Controls */}
            <div className="space-y-3">
              <h4 className="text-white text-sm font-medium">Display Layers</h4>
              
              <div className="flex items-center justify-between">
                <label className="text-white text-sm flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Day/Night Cycle
                </label>
                <Switch 
                  checked={showDayNightOverlay} 
                  onCheckedChange={setShowDayNightOverlay}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-white text-sm flex items-center gap-2">
                  <Cloud className="h-4 w-4" />
                  Weather Data
                </label>
                <Switch 
                  checked={showWeatherLayer} 
                  onCheckedChange={setShowWeatherLayer}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-white text-sm flex items-center gap-2">
                  <Navigation className="h-4 w-4" />
                  Flight Paths
                </label>
                <Switch 
                  checked={showFlightPaths} 
                  onCheckedChange={setShowFlightPaths}
                />
              </div>
            </div>
          </CardContent>
        </Card>
        
        {/* Time and Environment Info */}
        <Card className="w-80 bg-black/80 backdrop-blur-sm border-gray-600">
          <CardContent className="pt-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">UTC Time</span>
                <Badge variant="outline" className="text-white border-gray-600">
                  {currentTime.toUTCString().slice(17, 25)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">Day/Night</span>
                <Badge 
                  variant={dayNight.isDaytime ? "default" : "secondary"}
                  className={dayNight.isDaytime ? "bg-yellow-600" : "bg-blue-800"}
                >
                  {dayNight.isDaytime ? 'Daytime' : 'Nighttime'}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-white text-sm">Position</span>
                <span className="text-white text-xs font-mono">
                  {mapCenter.lat.toFixed(2)}°, {mapCenter.lon.toFixed(2)}°
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Map Display */}
      <div
        ref={mapContainerRef}
        className="w-full h-full cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Satellite Image */}
        {currentImageUrl && mapboxToken ? (
          <div className="relative w-full h-full">
            <img
              src={currentImageUrl}
              alt="Satellite Map"
              className="w-full h-full object-cover"
              style={{
                transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
                transition: isDragging ? 'none' : 'transform 0.3s ease-out'
              }}
              onError={() => console.error('Failed to load satellite image')}
              onLoad={() => console.log('Satellite image loaded successfully')}
            />
            
            {/* Day/Night Overlay */}
            {showDayNightOverlay && (
              <div 
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: dayNight.isDaytime 
                    ? 'linear-gradient(180deg, rgba(255,223,0,0.1) 0%, transparent 50%)' 
                    : 'linear-gradient(180deg, rgba(59,130,246,0.3) 0%, rgba(30,58,138,0.5) 100%)',
                  opacity: 0.6
                }}
              />
            )}
          </div>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
            <div className="text-white text-center">
              <Satellite className="h-12 w-12 mx-auto mb-4" />
              <div className="text-lg">Loading satellite imagery...</div>
              <div className="text-sm opacity-75">Connecting to Mapbox services</div>
            </div>
          </div>
        )}
        
        {/* Weather Overlay */}
        {showWeatherLayer && Object.entries(weatherData).map(([key, weather]) => {
          const [latStr, lonStr] = key.split('_');
          const lat = parseFloat(latStr);
          const lon = parseFloat(lonStr);
          const pixel = latLonToPixel(lat, lon);
          
          // Debug logging
          console.log(`Weather point: ${lat}, ${lon} -> pixel: ${pixel.x}, ${pixel.y}`);
          console.log(`Map center: ${mapCenter.lat}, ${mapCenter.lon}, zoom: ${zoomLevel}`);
          
          // Only render if within reasonable bounds (allow some off-screen for debugging)
          if (pixel.x < -100 || pixel.x > (mapContainerRef.current?.clientWidth || 0) + 100 || 
              pixel.y < -100 || pixel.y > (mapContainerRef.current?.clientHeight || 0) + 100) {
            return null;
          }
          
          return (
            <div
              key={key}
              className="absolute pointer-events-auto cursor-pointer"
              style={{
                left: pixel.x - 12,
                top: pixel.y - 12,
                transform: 'translate(-50%, -50%)'
              }}
              title={`${weather.conditions} • ${weather.temperature}°C • Wind ${weather.windSpeed}kt`}
            >
              <div className="relative bg-black/60 rounded-full p-1">
                {weather.precipitation > 0 && (
                  <CloudRain className="h-6 w-6 text-blue-400" />
                )}
                {weather.cloudCover > 70 && weather.precipitation === 0 && (
                  <Cloud className="h-6 w-6 text-gray-400" />
                )}
                {weather.precipitation === 0 && weather.cloudCover < 30 && (
                  <Sun className="h-6 w-6 text-yellow-400" />
                )}
                {weather.windSpeed > 15 && (
                  <Wind className="h-4 w-4 text-white absolute -top-1 -right-1" />
                )}
                
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs px-1 rounded whitespace-nowrap">
                  {weather.temperature}°C
                </div>
              </div>
            </div>
          );
        })}
        
        {/* Flight Data Overlay */}
        {showFlightPaths && flightData.map((flight) => {
          const pixel = latLonToPixel(flight.latitude, flight.longitude);
          return (
            <div
              key={flight.callsign}
              className="absolute pointer-events-auto cursor-pointer transform -translate-x-1/2 -translate-y-1/2"
              style={{
                left: pixel.x,
                top: pixel.y,
                transform: `translate(-50%, -50%) rotate(${flight.heading}deg)`
              }}
              onClick={() => selectFlight(flight)}
              title={`${flight.callsign} - ${flight.aircraft} - ${flight.altitude}ft - ${flight.velocity}kts`}
            >
              <div className={`relative ${selectedFlight?.callsign === flight.callsign ? 'scale-125' : ''} transition-transform`}>
                <Plane 
                  className={`h-4 w-4 ${
                    selectedFlight?.callsign === flight.callsign 
                      ? 'text-yellow-400' 
                      : 'text-red-500'
                  } drop-shadow-lg`}
                />
                <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs px-1 rounded whitespace-nowrap">
                  {flight.callsign}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}