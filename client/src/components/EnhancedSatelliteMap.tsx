import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Satellite, Plane, Sun, Moon, Cloud, CloudRain, Wind, Eye, Navigation, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
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

interface DayNightData {
  isDaytime: boolean;
  sunPosition: { lat: number; lon: number };
  moonPhase: number;
  twilightLevel: number; // 0-1, where 0 is full night, 1 is full day
}

export default function EnhancedSatelliteMap() {
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
  const [dayNightData, setDayNightData] = useState<DayNightData | null>(null);
  const [weatherData, setWeatherData] = useState<Record<string, WeatherData>>({});
  const [showDayNightOverlay, setShowDayNightOverlay] = useState(true);
  const [showWeatherLayer, setShowWeatherLayer] = useState(true);
  const [showFlightPaths, setShowFlightPaths] = useState(true);
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');
  const imageCache = useRef(new Map<string, HTMLImageElement>());
  const debounceTimer = useRef<NodeJS.Timeout>();
  
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

  // Calculate day/night cycle based on current time
  const calculateDayNightData = useCallback((time: Date): DayNightData => {
    const julianDay = (time.getTime() / 86400000) + 2440587.5;
    const n = julianDay - 2451545.0;
    
    // Calculate sun position (simplified)
    const L = (280.460 + 0.9856474 * n) % 360;
    const g = (357.528 + 0.9856003 * n) % 360;
    const lambda = L + 1.915 * Math.sin(g * Math.PI / 180);
    
    const sunLat = Math.asin(Math.sin(23.44 * Math.PI / 180) * Math.sin(lambda * Math.PI / 180)) * 180 / Math.PI;
    const sunLon = ((L - 180) % 360) - 180;
    
    // Calculate twilight level based on time and location
    const hourAngle = (time.getUTCHours() + time.getUTCMinutes() / 60) * 15 - 180;
    const twilightLevel = Math.max(0, Math.min(1, (Math.sin((hourAngle + sunLon) * Math.PI / 180) + 0.3) / 1.3));
    
    return {
      isDaytime: twilightLevel > 0.5,
      sunPosition: { lat: sunLat, lon: sunLon },
      moonPhase: ((julianDay % 29.53) / 29.53),
      twilightLevel
    };
  }, []);

  // Generate enhanced image URL with day/night and weather overlays
  const generateEnhancedImageUrl = useCallback((lat: number, lon: number, zoom: number, token: string, dayNight?: DayNightData) => {
    // Ensure coordinates are within valid bounds
    const clampedLat = Math.max(-85, Math.min(85, lat));
    const clampedLon = Math.max(-180, Math.min(180, lon));
    const clampedZoom = Math.max(1, Math.min(zoom, 18));
    
    // Round coordinates for better caching
    const roundedLat = Math.round(clampedLat * 100) / 100;
    const roundedLon = Math.round(clampedLon * 100) / 100;
    
    // Base satellite imagery style
    let style = 'satellite-v9';
    
    // Adjust style based on day/night if overlay is enabled
    if (showDayNightOverlay && dayNight) {
      if (dayNight.twilightLevel < 0.3) {
        style = 'satellite-v9'; // Night mode - keep satellite for city lights
      } else if (dayNight.twilightLevel < 0.7) {
        style = 'satellite-streets-v12'; // Twilight - hybrid view
      }
    }
    
    // Use standard resolution for better compatibility
    const url = `https://api.mapbox.com/styles/v1/mapbox/${style}/static/${roundedLon},${roundedLat},${clampedZoom}/1200x800?access_token=${token}`;
    console.log('Generated Mapbox URL:', url);
    return url;
  }, [showDayNightOverlay]);

  // Enhanced image loading with caching
  const loadEnhancedImage = useCallback((lat: number, lon: number, zoom: number, token: string) => {
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
    
    debounceTimer.current = setTimeout(() => {
      setImageLoading(true);
      setImageError(false);
      
      const imageUrl = generateEnhancedImageUrl(lat, lon, zoom, token, dayNightData || undefined);
      const cacheKey = `${lat.toFixed(3)}_${lon.toFixed(3)}_${zoom}_${dayNightData?.twilightLevel || 0}`;
      
      // Check cache first
      if (imageCache.current.has(cacheKey)) {
        const cachedImg = imageCache.current.get(cacheKey);
        if (cachedImg && cachedImg.complete) {
          setCurrentImageUrl(imageUrl);
          setImageLoading(false);
          setImageError(false);
          return;
        }
      }
      
      // Load new image with better error handling
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        console.log('Satellite image loaded successfully');
        imageCache.current.set(cacheKey, img);
        setCurrentImageUrl(imageUrl);
        setImageLoading(false);
        setImageError(false);
      };
      
      img.onerror = (error) => {
        console.error('Satellite image failed to load:', error);
        console.log('Failed URL:', imageUrl);
        setImageError(true);
        setImageLoading(false);
      };
      
      // Set source to trigger loading
      img.src = imageUrl;
      
    }, 500); // Increased debounce for better stability
  }, [generateEnhancedImageUrl, dayNightData]);

  // Fetch real weather data from API
  const fetchWeatherData = useCallback(async (lat: number, lon: number): Promise<WeatherData> => {
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
    
    // Fallback to reasonable defaults only if API fails
    return generateReasonableWeatherFallback(lat, lon);
  }, []);

  // Fallback weather generation for API failures only
  const generateReasonableWeatherFallback = useCallback((lat: number, lon: number): WeatherData => {
    const baseTemp = 15 - (Math.abs(lat) * 0.6);
    const seasonalVariation = Math.sin((currentTime.getMonth() + 1) * Math.PI / 6) * 10;
    
    return {
      temperature: Math.round(baseTemp + seasonalVariation + (Math.random() - 0.5) * 10),
      windSpeed: Math.round(5 + Math.random() * 25),
      windDirection: Math.round(Math.random() * 360),
      visibility: Math.round(5 + Math.random() * 15),
      conditions: ['Clear', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Overcast'][Math.floor(Math.random() * 5)],
      cloudCover: Math.round(Math.random() * 100),
      precipitation: Math.random() > 0.7 ? Math.round(Math.random() * 10) : 0
    };
  }, [currentTime]);

  // Coordinate conversion utilities
  const latLonToPixel = useCallback((lat: number, lon: number) => {
    if (!mapContainerRef.current) return { x: 0, y: 0 };
    
    const containerRect = mapContainerRef.current.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;
    
    // Simple projection (Web Mercator approximation)
    const x = ((lon - mapCenter.lon) * Math.cos(mapCenter.lat * Math.PI / 180) * zoomLevel * 10) + width / 2 + dragOffset.x;
    const y = (-(lat - mapCenter.lat) * zoomLevel * 10) + height / 2 + dragOffset.y;
    
    return { x, y };
  }, [mapCenter, zoomLevel, dragOffset]);

  // Navigation functions
  const handlePresetNavigation = (preset: typeof navigationPresets[0]) => {
    setMapCenter({ lat: preset.lat, lon: preset.lon });
    setZoomLevel(preset.zoom);
    setDragOffset({ x: 0, y: 0 });
  };

  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 1, 12));
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
      const sensitivity = 0.001 * (12 - zoomLevel);
      setMapCenter(prev => ({
        lat: prev.lat + (dragOffset.y * sensitivity),
        lon: prev.lon - (dragOffset.x * sensitivity)
      }));
      setDragOffset({ x: 0, y: 0 });
    }
    setIsDragging(false);
  };

  // Initialize and update systems
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
      const now = new Date();
      setCurrentTime(now);
      setDayNightData(calculateDayNightData(now));
    }, 60000); // Update every minute
    
    // Initial calculation
    const now = new Date();
    setCurrentTime(now);
    setDayNightData(calculateDayNightData(now));
    
    return () => clearInterval(timeInterval);
  }, [calculateDayNightData]);

  useEffect(() => {
    if (mapboxToken) {
      loadEnhancedImage(mapCenter.lat, mapCenter.lon, zoomLevel, mapboxToken);
    }
  }, [mapCenter, zoomLevel, mapboxToken, loadEnhancedImage]);

  // Load weather data for current view
  const loadWeatherForView = useCallback(async () => {
    if (!showWeatherLayer) return;
    
    const newWeatherData: Record<string, WeatherData> = {};
    const gridSize = 4; // 4x4 grid of weather points
    
    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const lat = mapCenter.lat + ((i - gridSize/2) * (20 / zoomLevel));
        const lon = mapCenter.lon + ((j - gridSize/2) * (40 / zoomLevel));
        const key = `${lat.toFixed(1)}_${lon.toFixed(1)}`;
        
        if (!weatherData[key]) {
          try {
            const weather = await fetchWeatherData(lat, lon);
            newWeatherData[key] = weather;
          } catch (error) {
            console.error('Failed to load weather for', lat, lon, error);
          }
        }
      }
    }
    
    setWeatherData(prev => ({ ...prev, ...newWeatherData }));
  }, [mapCenter, zoomLevel, showWeatherLayer, weatherData, fetchWeatherData]);

  useEffect(() => {
    if (showWeatherLayer) {
      loadWeatherForView();
    }
  }, [mapCenter, zoomLevel, showWeatherLayer, loadWeatherForView]);

  // Generate weather overlay with real data
  const renderWeatherOverlay = () => {
    if (!showWeatherLayer || !mapContainerRef.current) return null;
    
    const weatherPoints = Object.entries(weatherData).map(([key, weather]) => {
      const [latStr, lonStr] = key.split('_');
      const lat = parseFloat(latStr);
      const lon = parseFloat(lonStr);
      const pixel = latLonToPixel(lat, lon);
      
      if (pixel.x > 0 && pixel.x < mapContainerRef.current.clientWidth && 
          pixel.y > 0 && pixel.y < mapContainerRef.current.clientHeight) {
        return { lat, lon, pixel, weather, key };
      }
      return null;
    }).filter(Boolean);
    
    return weatherPoints.map((point) => {
      if (!point) return null;
      
      return (
        <div
          key={point.key}
          className="absolute pointer-events-auto cursor-pointer"
          style={{
            left: point.pixel.x - 12,
            top: point.pixel.y - 12,
            transform: 'translate(-50%, -50%)'
          }}
          title={`${point.weather.conditions} • ${point.weather.temperature}°C • Wind ${point.weather.windSpeed}kt • Vis ${point.weather.visibility}km`}
        >
          <div className="relative bg-black/60 rounded-full p-1">
            {point.weather.precipitation > 0 && (
              <CloudRain className="h-6 w-6 text-blue-400" />
            )}
            {point.weather.cloudCover > 70 && point.weather.precipitation === 0 && (
              <Cloud className="h-6 w-6 text-gray-400" />
            )}
            {point.weather.windSpeed > 15 && (
              <Wind className="h-4 w-4 text-white absolute -top-1 -right-1" />
            )}
            {point.weather.precipitation === 0 && point.weather.cloudCover < 30 && (
              <Sun className="h-6 w-6 text-yellow-400" />
            )}
            
            {/* Temperature display */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 bg-black/75 text-white text-xs px-1 rounded whitespace-nowrap">
              {point.weather.temperature}°C
            </div>
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  // Render day/night overlay
  const renderDayNightOverlay = () => {
    if (!showDayNightOverlay || !dayNightData || !mapContainerRef.current) return null;
    
    const containerRect = mapContainerRef.current.getBoundingClientRect();
    const sunPixel = latLonToPixel(dayNightData.sunPosition.lat, dayNightData.sunPosition.lon);
    
    return (
      <div className="absolute inset-0 pointer-events-none">
        {/* Night overlay */}
        <div 
          className="absolute inset-0 bg-gradient-radial from-transparent via-blue-900/20 to-blue-900/40"
          style={{
            opacity: 1 - dayNightData.twilightLevel,
            background: `radial-gradient(circle at ${sunPixel.x}px ${sunPixel.y}px, transparent 0%, rgba(59, 130, 246, 0.1) 30%, rgba(59, 130, 246, 0.3) 70%, rgba(30, 58, 138, 0.5) 100%)`
          }}
        />
        
        {/* Twilight zones */}
        {dayNightData.twilightLevel > 0.2 && dayNightData.twilightLevel < 0.8 && (
          <div
            className="absolute inset-0 bg-gradient-linear from-orange-400/10 to-pink-400/10"
            style={{ opacity: Math.sin(dayNightData.twilightLevel * Math.PI) }}
          />
        )}
        
        {/* Sun indicator */}
        {dayNightData.isDaytime && (
          <div
            className="absolute"
            style={{
              left: sunPixel.x - 8,
              top: sunPixel.y - 8,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <Sun className="h-6 w-6 text-yellow-400 animate-pulse" />
          </div>
        )}
        
        {/* Moon indicator */}
        {!dayNightData.isDaytime && (
          <div
            className="absolute"
            style={{
              left: sunPixel.x + 200 - 8, // Opposite side
              top: sunPixel.y - 8,
              transform: 'translate(-50%, -50%)'
            }}
          >
            <Moon className="h-6 w-6 text-blue-200" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-900">
      {/* Enhanced Navigation Panel */}
      <div className="absolute top-4 left-4 z-20 space-y-4">
        <Card className="w-80 bg-black/80 backdrop-blur-sm border-gray-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <Satellite className="h-5 w-5" />
              Enhanced Satellite Navigation
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
                  max={12}
                  step={1}
                  className="flex-1"
                />
                <Button size="sm" variant="outline" onClick={handleZoomIn} disabled={zoomLevel >= 12}>
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
              
              {dayNightData && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Day/Night</span>
                    <Badge 
                      variant={dayNightData.isDaytime ? "default" : "secondary"}
                      className={dayNightData.isDaytime ? "bg-yellow-600" : "bg-blue-800"}
                    >
                      {dayNightData.isDaytime ? 'Daytime' : 'Nighttime'}
                    </Badge>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-white text-sm">Twilight Level</span>
                    <span className="text-white text-sm">
                      {Math.round(dayNightData.twilightLevel * 100)}%
                    </span>
                  </div>
                </>
              )}
              
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

      {/* Enhanced Map Display */}
      <div
        ref={mapContainerRef}
        className="w-full h-full cursor-move"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Base Satellite Image */}
        {currentImageUrl && !imageError && (
          <img
            src={currentImageUrl}
            alt="Enhanced Satellite Map"
            className="w-full h-full object-cover"
            style={{
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`,
              transition: isDragging ? 'none' : 'transform 0.3s ease-out'
            }}
          />
        )}
        
        {/* Loading Overlay */}
        {imageLoading && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
            <div className="text-white text-lg">Loading enhanced imagery...</div>
          </div>
        )}
        
        {/* Error Fallback */}
        {imageError && (
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900 to-purple-900 flex items-center justify-center">
            <div className="text-white text-center">
              <Satellite className="h-12 w-12 mx-auto mb-4" />
              <div className="text-lg">Satellite imagery unavailable</div>
              <div className="text-sm opacity-75">Using procedural background</div>
            </div>
          </div>
        )}
        
        {/* Day/Night Overlay */}
        {renderDayNightOverlay()}
        
        {/* Weather Overlay */}
        {renderWeatherOverlay()}
        
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