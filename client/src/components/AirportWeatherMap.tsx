import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plane, MapPin, Wind, Eye, Cloud, Info, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';

interface Airport {
  icao: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  elevation: number;
  timezone: string;
  runways: string[];
  category: 'major' | 'international' | 'regional';
}

interface AviationWeatherData {
  icao: string;
  metar: {
    raw: string;
    parsed: {
      temperature: number;
      dewpoint: number;
      windSpeed: number;
      windDirection: number;
      visibility: number;
      altimeter: number;
      conditions: string;
      clouds: string[];
      timestamp: string;
    };
  };
  taf: {
    raw: string;
    parsed: {
      validFrom: string;
      validTo: string;
      forecast: Array<{
        time: string;
        windSpeed: number;
        windDirection: number;
        visibility: number;
        conditions: string;
        clouds: string[];
      }>;
    };
  };
}

const AirportWeatherMap: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapboxToken, setMapboxToken] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Map state
  const [mapCenter, setMapCenter] = useState({ lat: 51.4706, lon: -0.4619 }); // Default to London Heathrow
  const [zoomLevel, setZoomLevel] = useState(6);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Data states
  const [airports, setAirports] = useState<Airport[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [aviationWeather, setAviationWeather] = useState<AviationWeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  
  // Layer toggles
  const [showMajorAirports, setShowMajorAirports] = useState(true);
  const [showRegionalAirports, setShowRegionalAirports] = useState(false);

  // Load Mapbox token
  useEffect(() => {
    const fetchMapboxToken = async () => {
      try {
        const response = await fetch('/api/config/mapbox');
        const data = await response.json();
        setMapboxToken(data.token);
      } catch (error) {
        console.error('Failed to load Mapbox token:', error);
        setError('Failed to load map configuration');
      } finally {
        setLoading(false);
      }
    };

    fetchMapboxToken();
  }, []);

  // Load airports
  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const response = await fetch('/api/airports/major');
        const data = await response.json();
        if (data.success) {
          setAirports(data.airports);
        }
      } catch (error) {
        console.error('Failed to load airports:', error);
      }
    };

    fetchAirports();
  }, []);

  // Coordinate conversion for Mapbox static images
  const latLonToPixel = useCallback((lat: number, lon: number) => {
    if (!mapContainerRef.current) return { x: 0, y: 0 };
    
    const containerRect = mapContainerRef.current.getBoundingClientRect();
    const width = containerRect.width;
    const height = containerRect.height;
    
    // Mapbox static image dimensions
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

  // Handle airport selection
  const handleAirportClick = async (airport: Airport) => {
    setSelectedAirport(airport);
    setWeatherLoading(true);
    setAviationWeather(null);

    try {
      const response = await fetch(`/api/weather/aviation/${airport.icao}`);
      const data = await response.json();
      if (data.success && data.data) {
        setAviationWeather(data.data);
      }
    } catch (error) {
      console.error('Failed to load aviation weather:', error);
    } finally {
      setWeatherLoading(false);
    }
  };

  // Navigation presets
  const navigationPresets = [
    { name: 'London Heathrow', lat: 51.4706, lon: -0.4619, zoom: 8 },
    { name: 'New York JFK', lat: 40.6413, lon: -73.7781, zoom: 8 },
    { name: 'Los Angeles', lat: 33.9425, lon: -118.4081, zoom: 8 },
    { name: 'Frankfurt', lat: 50.0264, lon: 8.5431, zoom: 8 },
    { name: 'Tokyo Narita', lat: 35.7647, lon: 140.3864, zoom: 8 },
  ];

  // Handle navigation
  const navigateTo = (lat: number, lon: number, zoom: number = 8) => {
    setMapCenter({ lat, lon });
    setZoomLevel(zoom);
    setDragOffset({ x: 0, y: 0 });
  };

  // Mouse handlers for map dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - dragOffset.x, y: e.clientY - dragOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setDragOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom handlers
  const handleZoomIn = () => setZoomLevel(prev => Math.min(prev + 1, 10));
  const handleZoomOut = () => setZoomLevel(prev => Math.max(prev - 1, 1));

  // Filter airports based on settings
  const visibleAirports = airports.filter(airport => {
    if (airport.category === 'major' && showMajorAirports) return true;
    if (airport.category !== 'major' && showRegionalAirports) return true;
    return false;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p>Loading satellite imagery...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center text-red-500">
          <p>Error: {error}</p>
        </div>
      </div>
    );
  }

  const satelliteImageUrl = `https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${mapCenter.lon},${mapCenter.lat},${zoomLevel}/1200x800?access_token=${mapboxToken}`;

  return (
    <div className="space-y-4">
      {/* Map Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            Airport Weather Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center justify-between">
            {/* Navigation Presets */}
            <div className="flex flex-wrap gap-2">
              {navigationPresets.map((preset, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => navigateTo(preset.lat, preset.lon, preset.zoom)}
                >
                  {preset.name}
                </Button>
              ))}
            </div>

            {/* Layer Controls */}
            <div className="flex gap-4 items-center">
              <div className="flex items-center space-x-2">
                <Switch
                  id="major-airports"
                  checked={showMajorAirports}
                  onCheckedChange={setShowMajorAirports}
                />
                <label htmlFor="major-airports" className="text-sm">Major Airports</label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="regional-airports"
                  checked={showRegionalAirports}
                  onCheckedChange={setShowRegionalAirports}
                />
                <label htmlFor="regional-airports" className="text-sm">Regional Airports</label>
              </div>
            </div>

            {/* Zoom Controls */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleZoomOut}>
                -
              </Button>
              <span className="px-3 py-1 bg-gray-100 rounded text-sm">
                Zoom: {zoomLevel}
              </span>
              <Button variant="outline" size="sm" onClick={handleZoomIn}>
                +
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Map Container */}
      <div className="relative">
        <div
          ref={mapContainerRef}
          className="relative w-full h-[600px] bg-gray-900 rounded-lg overflow-hidden cursor-move"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {/* Satellite Background */}
          <img
            src={satelliteImageUrl}
            alt="Satellite view"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              transform: `translate(${dragOffset.x}px, ${dragOffset.y}px)`
            }}
            onError={() => setError('Failed to load satellite imagery')}
          />

          {/* Airport Markers */}
          {visibleAirports.map((airport) => {
            const pixel = latLonToPixel(airport.latitude, airport.longitude);
            const isVisible = pixel.x >= -50 && pixel.x <= (mapContainerRef.current?.clientWidth || 0) + 50 &&
                            pixel.y >= -50 && pixel.y <= (mapContainerRef.current?.clientHeight || 0) + 50;

            if (!isVisible) return null;

            return (
              <div
                key={airport.icao}
                className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer group"
                style={{ left: pixel.x, top: pixel.y }}
                onClick={(e) => {
                  e.stopPropagation();
                  handleAirportClick(airport);
                }}
              >
                <div className={`w-4 h-4 rounded-full flex items-center justify-center transition-all duration-200 group-hover:scale-125 ${
                  selectedAirport?.icao === airport.icao 
                    ? 'bg-yellow-400 ring-2 ring-yellow-300' 
                    : airport.category === 'major' 
                      ? 'bg-blue-500 hover:bg-blue-400' 
                      : 'bg-green-500 hover:bg-green-400'
                }`}>
                  <Plane className="h-2 w-2 text-white" />
                </div>
                
                {/* Airport Label */}
                <div className="absolute top-5 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {airport.iata} - {airport.name}
                </div>
              </div>
            );
          })}

          {/* Map Info */}
          <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white p-3 rounded-lg">
            <div className="text-sm space-y-1">
              <div>Center: {mapCenter.lat.toFixed(4)}°, {mapCenter.lon.toFixed(4)}°</div>
              <div>Zoom: {zoomLevel}</div>
              <div>Airports: {visibleAirports.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Aviation Weather Panel */}
      {selectedAirport && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                {selectedAirport.name} ({selectedAirport.icao})
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedAirport(null);
                  setAviationWeather(null);
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Airport Info */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">City:</span> {selectedAirport.city}
                </div>
                <div>
                  <span className="font-medium">Country:</span> {selectedAirport.country}
                </div>
                <div>
                  <span className="font-medium">Elevation:</span> {selectedAirport.elevation} ft
                </div>
                <div>
                  <span className="font-medium">Runways:</span> {selectedAirport.runways.join(', ')}
                </div>
              </div>

              {/* Weather Loading */}
              {weatherLoading && (
                <div className="flex items-center gap-2 text-blue-600">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                  Loading aviation weather data...
                </div>
              )}

              {/* METAR and TAF Data */}
              {aviationWeather && (
                <div className="space-y-4">
                  {/* METAR */}
                  <div>
                    <h4 className="font-medium text-lg mb-2">METAR</h4>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div className="font-mono text-sm bg-white p-2 rounded border">
                        {aviationWeather.metar.raw || 'No METAR data available'}
                      </div>
                      {aviationWeather.metar.parsed && (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                          <div className="flex items-center gap-2">
                            <Wind className="h-4 w-4 text-blue-500" />
                            <span>{aviationWeather.metar.parsed.windDirection}° {aviationWeather.metar.parsed.windSpeed} kt</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Eye className="h-4 w-4 text-green-500" />
                            <span>{aviationWeather.metar.parsed.visibility} m</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Cloud className="h-4 w-4 text-gray-500" />
                            <span>{aviationWeather.metar.parsed.temperature}°C</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Info className="h-4 w-4 text-orange-500" />
                            <span>{aviationWeather.metar.parsed.altimeter}" Hg</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* TAF */}
                  <div>
                    <h4 className="font-medium text-lg mb-2">TAF (Terminal Aerodrome Forecast)</h4>
                    <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                      <div className="font-mono text-sm bg-white p-2 rounded border">
                        {aviationWeather.taf.raw || 'No TAF data available'}
                      </div>
                      {aviationWeather.taf.parsed.forecast.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-sm text-gray-600">
                            Valid: {new Date(aviationWeather.taf.parsed.validFrom).toLocaleString()} - {new Date(aviationWeather.taf.parsed.validTo).toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500">
                            Forecast periods: {aviationWeather.taf.parsed.forecast.length}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AirportWeatherMap;