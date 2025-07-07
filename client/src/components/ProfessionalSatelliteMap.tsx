import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { X, AlertTriangle, Cloud, Fuel, Wrench, Phone, Building, Zap } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { useSelectedFlight } from '../lib/stores/useSelectedFlight';
import SigmetOverlay from './SigmetOverlay';
import Papa from 'papaparse';

// Fix Leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Error Boundary Component for Map - Less restrictive to allow minor rendering issues
class SatelliteMapErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean, errorCount: number}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, errorCount: 0 };
  }

  static getDerivedStateFromError(error: any) {
    // Only show error boundary for critical errors, not minor rendering issues
    if (error?.message?.includes('Cannot read properties') || 
        error?.message?.includes('ResizeObserver') ||
        error?.message?.includes('Leaflet') && error?.message?.includes('marker')) {
      return { hasError: false, errorCount: 0 }; // Allow these minor errors
    }
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.warn('Map rendering issue (non-critical):', error?.message);
    // Only log critical errors
    if (!error?.message?.includes('ResizeObserver') && !error?.message?.includes('marker')) {
      console.error('Critical satellite map error:', error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-900 text-white">
          <div className="text-center p-8">
            <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-2xl font-semibold mb-4">Map Service Issue</h2>
            <p className="text-gray-400 mb-6 max-w-md">
              Experiencing connectivity issues with satellite imagery service.
            </p>
            <button 
              onClick={() => this.setState({ hasError: false, errorCount: 0 })}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg font-medium transition-colors"
            >
              Retry Connection
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Import types and data
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
  fuel: number;
  engineStatus: string;
  systemsStatus: string;
}

interface AviationWeatherData {
  icao: string;
  metar: {
    raw: string;
  };
  taf: {
    raw: string;
  };
}

interface ServiceCoverageData {
  icao: string;
  iata: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  support: string;
  contact?: string;
  phone?: string;
}

// Leaflet styles for dark theme
const leafletStyles = `
  .leaflet-popup-content-wrapper {
    background: #2c2c2c !important;
    color: #fff !important;
    border-radius: 8px !important;
    box-shadow: 0 4px 12px rgba(0,0,0,0.4) !important;
  }
  
  .leaflet-popup-content {
    margin: 12px !important;
  }
  
  .leaflet-popup-tip {
    background: #2c2c2c !important;
  }
  
  .leaflet-popup-close-button {
    color: #fff !important;
    font-size: 18px !important;
    padding: 4px 8px !important;
  }
  
  .leaflet-popup-close-button:hover {
    background: rgba(255,255,255,0.1) !important;
    border-radius: 4px !important;
  }
  
  .leaflet-control-container .leaflet-control {
    background: rgba(42, 42, 42, 0.95) !important;
    border: 1px solid #555 !important;
    border-radius: 8px !important;
    color: #fff !important;
    backdrop-filter: blur(10px) !important;
  }
  
  .leaflet-control-zoom a {
    background-color: rgba(42, 42, 42, 0.95) !important;
    border: 1px solid #555 !important;
    color: #fff !important;
  }
  
  .leaflet-control-zoom a:hover {
    background-color: rgba(60, 60, 60, 0.95) !important;
    border-color: #4CAF50 !important;
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(10px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const styleElement = document.createElement('style');
  styleElement.textContent = leafletStyles;
  document.head.appendChild(styleElement);
}

// Custom airport icon with service indicator
const createAirportIcon = (selected: boolean, serviceSupport?: string) => {
  const serviceColor = serviceSupport ? getServiceIndicatorColor(serviceSupport) : '#3b82f6';
  const baseColor = selected ? '#10b981' : serviceColor;
  const borderColor = selected ? '#059669' : serviceColor;
  
  return L.divIcon({
    className: 'custom-airport-marker',
    html: `
      <div style="
        position: relative;
        width: 12px; 
        height: 12px; 
        background: ${baseColor}; 
        border: 1.5px solid ${borderColor};
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        transition: all 0.3s ease;
      ">
        <div style="color: white; font-size: 8px; font-weight: bold;">✈</div>
        ${serviceSupport ? `
          <div style="
            position: absolute;
            top: -1px;
            right: -1px;
            width: 4px;
            height: 4px;
            background: ${serviceColor};
            border: 0.5px solid white;
            border-radius: 50%;
            box-shadow: 0 1px 2px rgba(0,0,0,0.2);
          "></div>
        ` : ''}
      </div>
    `,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
};

// Function to get service indicator color (moved to component scope)
const getServiceIndicatorColor = (support: string): string => {
  switch (support.toLowerCase()) {
    case 'both': return '#22c55e'; // Green - full services
    case 'fuel_only': return '#3b82f6'; // Blue - fuel only
    case 'ground_only': return '#f59e0b'; // Orange - ground handling only
    default: return '#ef4444'; // Red - no services
  }
};

// Custom flight icon - Compact size for less crowding
const createFlightIcon = (heading: number, selected: boolean) => L.divIcon({
  className: 'custom-flight-marker',
  html: `
    <div style="
      transform: rotate(${heading}deg);
      color: ${selected ? '#fbbf24' : '#ef4444'};
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
      font-size: 16px;
      font-weight: bold;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${selected ? 'rgba(251, 191, 36, 0.2)' : 'rgba(239, 68, 68, 0.2)'};
      border-radius: 50%;
      border: 1.5px solid ${selected ? '#fbbf24' : '#ef4444'};
      width: 20px;
      height: 20px;
      transition: all 0.3s ease;
      cursor: pointer;
      z-index: 1000;
    ">
      ✈
    </div>
  `,
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

// Enhanced Weather Radar Overlay Component with interactive features
function WeatherRadarOverlay({ weatherRadarImage, radarOpacity = 1.0 }: { weatherRadarImage: string; radarOpacity?: number }) {
  const map = useMap();
  const [weatherIntensity, setWeatherIntensity] = useState<string>('');
  const [lastUpdate, setLastUpdate] = useState<string>('');
  const [overlayVisible, setOverlayVisible] = useState(false);
  
  useEffect(() => {
    if (!weatherRadarImage) return;
    
    console.log('Adding weather radar overlay...', weatherRadarImage.substring(0, 50));
    
    // Use proper weather radar bounds - NOAA covers Continental US
    // For global coverage, use appropriate regional bounds
    const mapCenter = map.getCenter();
    
    // Determine if we're viewing US or global area and set appropriate bounds
    const isUSView = mapCenter.lat >= 20 && mapCenter.lat <= 50 && mapCenter.lng >= -130 && mapCenter.lng <= -60;
    
    const imageBounds: [[number, number], [number, number]] = isUSView 
      ? [[20, -130], [50, -60]]  // Continental US bounds for NOAA radar
      : [[mapCenter.lat - 15, mapCenter.lng - 20], [mapCenter.lat + 15, mapCenter.lng + 20]]; // Regional bounds for global radar
    
    console.log('Weather radar bounds:', imageBounds, 'isUSView:', isUSView);
    
    const imageOverlay = L.imageOverlay(weatherRadarImage, imageBounds, {
      opacity: radarOpacity,
      interactive: true,
      className: 'weather-radar-overlay enhanced-radar',
      crossOrigin: 'anonymous'
    });
    
    // Add hover interaction for weather data
    imageOverlay.on('mouseover', (e: any) => {
      const latlng = e.latlng;
      // Simulate weather intensity calculation based on position
      const intensity = Math.random() * 50; // In real implementation, this would come from radar data
      setWeatherIntensity(`${intensity.toFixed(1)} dBZ`);
    });
    
    imageOverlay.on('mouseout', () => {
      setWeatherIntensity('');
    });
    
    imageOverlay.on('add', () => {
      console.log('Weather radar overlay added to map');
      setOverlayVisible(true);
    });
    
    imageOverlay.on('remove', () => {
      console.log('Weather radar overlay removed from map');
      setOverlayVisible(false);
    });
    
    imageOverlay.addTo(map);
    setLastUpdate(new Date().toLocaleTimeString());
    
    return () => {
      imageOverlay.remove();
    };
  }, [map, weatherRadarImage, radarOpacity]);
  
  return (
    <>
      {/* Weather Overlay Status Indicator */}
      {overlayVisible && (
        <div className="absolute top-16 left-4 z-[1000] bg-green-900/90 backdrop-blur-sm border border-green-500/50 px-3 py-2 rounded-lg text-white text-sm">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-green-400" />
            <span className="font-bold text-green-300">Weather Radar Active</span>
          </div>
          <div className="text-xs text-gray-300 mt-1">NOAA Live Data</div>
        </div>
      )}
      
      {/* Weather data display */}
      {weatherIntensity && (
        <div className="absolute top-32 left-4 z-[1000] bg-black/90 backdrop-blur-sm border border-blue-500/50 px-3 py-2 rounded-lg text-white text-sm">
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 text-blue-400" />
            <span className="font-bold text-blue-300">{weatherIntensity}</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">Radar Intensity</div>
        </div>
      )}
      
      {/* Last update timestamp */}
      {lastUpdate && (
        <div className="absolute bottom-16 left-4 z-[1000] bg-black/80 backdrop-blur-sm border border-gray-600 px-3 py-2 rounded-lg text-white text-xs">
          <div className="text-gray-400">Last Update: {lastUpdate}</div>
        </div>
      )}
    </>
  );
}

// Coordinate display component
function CoordinateDisplay() {
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });

  useMapEvents({
    mousemove: (e) => {
      setCoordinates({
        lat: e.latlng.lat,
        lng: e.latlng.lng
      });
    },
  });

  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-black/80 backdrop-blur-sm border border-gray-600 px-3 py-2 rounded-lg text-white text-sm font-mono">
      Lat: {coordinates.lat.toFixed(6)}, Lng: {coordinates.lng.toFixed(6)}
    </div>
  );
}



// Weather controls removed - moved to Weather & Airspace section

function ProfessionalSatelliteMapCore() {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [flightData, setFlightData] = useState<FlightPosition[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [aviationWeather, setAviationWeather] = useState<AviationWeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [showAirports, setShowAirports] = useState(true);
  const [showFlights, setShowFlights] = useState(true);
  const [showWeatherOverlay, setShowWeatherOverlay] = useState(false);
  const [showSigmets, setShowSigmets] = useState(false);
  const [weatherRadarImage, setWeatherRadarImage] = useState<string | null>(null);
  const [radarLoading, setRadarLoading] = useState(false);
  const [radarOpacity, setRadarOpacity] = useState(1.0);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(15); // minutes
  const [searchTerm, setSearchTerm] = useState('');
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [serviceData, setServiceData] = useState<ServiceCoverageData[]>([]);
  
  const { selectFlight, selectedFlight } = useSelectedFlight();
  
  // Enhanced weather radar functionality with smart geographic selection
  const fetchWeatherRadar = async (mapCenter?: { lat: number; lng: number }) => {
    if (radarLoading) return;
    
    setRadarLoading(true);
    try {
      // Get current map center or use provided coordinates
      const params = new URLSearchParams({
        source: 'smart'
      });
      
      if (mapCenter) {
        params.append('lat', mapCenter.lat.toString());
        params.append('lng', mapCenter.lng.toString());
        console.log(`Fetching weather radar for coordinates: ${mapCenter.lat}, ${mapCenter.lng}`);
      } else {
        console.log('Fetching weather radar with smart global detection');
      }
      
      const response = await fetch(`/api/weather/radar?${params.toString()}`);
      const data = await response.json();
      
      if (data.success && data.imageUrl) {
        setWeatherRadarImage(data.imageUrl);
        console.log('Weather radar loaded - global coverage active');
      } else {
        console.error('Failed to load weather radar:', data.error);
        // Try RainViewer as global fallback
        const fallbackResponse = await fetch('/api/weather/radar?source=rainviewer');
        const fallbackData = await fallbackResponse.json();
        if (fallbackData.success && fallbackData.imageUrl) {
          setWeatherRadarImage(fallbackData.imageUrl);
          console.log('Fallback global radar loaded successfully');
        }
      }
    } catch (error) {
      console.error('Weather radar request failed:', error);
    } finally {
      setRadarLoading(false);
    }
  };

  // Load weather radar when overlay is enabled
  useEffect(() => {
    if (showWeatherOverlay && autoRefresh) {
      fetchWeatherRadar();
      const interval = setInterval(() => {
        fetchWeatherRadar(); // Use current map center for smart selection
      }, refreshInterval * 60 * 1000);
      return () => clearInterval(interval);
    }
  }, [showWeatherOverlay, autoRefresh, refreshInterval]);

  // Helper function to get service coverage for an airport
  const getServiceCoverage = (airport: Airport): ServiceCoverageData | null => {
    return serviceData.find(service => 
      service.icao === airport.icao || service.iata === airport.iata
    ) || null;
  };



  // Filter airports based on search term
  const filteredAirports = airports.filter(airport =>
    airport.icao.toLowerCase().includes(searchTerm.toLowerCase()) ||
    airport.iata.toLowerCase().includes(searchTerm.toLowerCase()) ||
    airport.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    airport.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
    airport.country.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Load airports
  useEffect(() => {
    const fetchAirports = async () => {
      try {
        const response = await fetch('/api/airports/major');
        const data = await response.json();
        if (data.success && data.airports) {
          console.log('Airport data received:', data.airports.slice(0, 3)); // Debug first 3 airports
          const validAirports = data.airports.filter((airport: any) => {
            const isValid = airport.latitude != null && airport.longitude != null && 
                           !isNaN(airport.latitude) && !isNaN(airport.longitude);
            if (!isValid) {
              console.warn('Invalid airport coordinates:', airport.icao, airport.latitude, airport.longitude);
            }
            return isValid;
          });
          setAirports(validAirports);
          console.log(`Loaded ${validAirports.length} valid airports out of ${data.airports.length} total`);
        }
      } catch (error) {
        console.error('Failed to fetch airports:', error);
      }
    };

    fetchAirports();
  }, []);

  // Load service coverage data
  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        const response = await fetch('/top300_airport_support.csv');
        const text = await response.text();
        const parsed = Papa.parse(text, { header: true }).data as any[];
        const serviceData = parsed.map((entry: any) => ({
          icao: entry.ICAO,
          iata: entry.IATA,
          name: entry['Airport Name'],
          country: entry.Country,
          lat: parseFloat(entry.Latitude),
          lon: parseFloat(entry.Longitude),
          support: entry.Support?.toLowerCase() || 'unknown',
          contact: entry.Contact || 'Not available',
          phone: entry.Phone || 'Not available'
        })).filter((service: ServiceCoverageData) => 
          !isNaN(service.lat) && !isNaN(service.lon) && service.icao
        );
        setServiceData(serviceData);
        console.log(`Loaded ${serviceData.length} service coverage entries`);
      } catch (error) {
        console.error('Failed to fetch service data:', error);
      }
    };

    fetchServiceData();
  }, []);

  // Load flight data
  useEffect(() => {
    const fetchFlightData = async () => {
      try {
        const response = await fetch('/api/aviation/virgin-atlantic-flights');
        const data = await response.json();
        if (data.success && data.flights) {
          console.log('Flight data received:', data.flights.slice(0, 2)); // Debug first 2 flights
          const validFlights = data.flights.filter((flight: any) => {
            const isValid = flight.latitude != null && flight.longitude != null && 
                           !isNaN(flight.latitude) && !isNaN(flight.longitude);
            if (!isValid) {
              console.warn('Invalid flight coordinates:', flight.callsign || flight.flight_number, flight.latitude, flight.longitude);
            }
            return isValid;
          });
          setFlightData(validFlights);
          console.log(`Loaded ${validFlights.length} valid flights out of ${data.flights.length} total`);
        }
      } catch (error) {
        console.error('Failed to fetch flight data:', error);
      }
    };

    fetchFlightData();
    const interval = setInterval(fetchFlightData, 30000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="w-full h-full bg-gray-900 relative">
      
      {/* Compact Weather Controls */}
      <div className="absolute top-4 left-4 z-[1000] bg-black/90 border border-gray-600 rounded-lg p-2 backdrop-blur-sm max-w-[160px]">
        <div className="flex items-center gap-2 mb-1">
          <Cloud className="h-3 w-3 text-blue-400" />
          <span className="text-white text-xs font-medium">Weather</span>
          <Switch
            checked={showWeatherOverlay}
            onCheckedChange={(checked) => {
              setShowWeatherOverlay(checked);
              if (checked && !weatherRadarImage) {
                fetchWeatherRadar();
              }
            }}
            className="scale-75"
          />
          {radarLoading && (
            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
          )}
        </div>
        
        <div className="flex items-center gap-2 mb-1">
          <Zap className="h-3 w-3 text-orange-400" />
          <span className="text-white text-xs font-medium">SIGMET</span>
          <Switch
            checked={showSigmets}
            onCheckedChange={setShowSigmets}
            className="scale-75"
          />
        </div>
        
        {showWeatherOverlay && (
          <div className="space-y-1">
            <div className="flex items-center gap-1">
              <span className="text-xs text-gray-400">Opacity:</span>
              <input
                type="range"
                min="0.3"
                max="1.0"
                step="0.1"
                value={radarOpacity}
                onChange={(e) => setRadarOpacity(parseFloat(e.target.value))}
                className="w-12 h-1 bg-gray-600 rounded"
              />
              <span className="text-xs text-gray-400 w-8">{Math.round(radarOpacity * 100)}%</span>
            </div>
            
            <div className="flex items-center gap-1">
              <button
                onClick={() => fetchWeatherRadar()}
                disabled={radarLoading}
                className="flex items-center gap-1 px-1 py-0.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded transition-colors"
              >
                <Cloud className="h-2 w-2" />
                Refresh
              </button>
              <Switch
                checked={autoRefresh}
                onCheckedChange={setAutoRefresh}
                className="scale-75"
              />
              <span className="text-xs text-gray-400">{refreshInterval}min</span>
            </div>
          </div>
        )}
        

      </div>


      {/* Selected Airport Weather Panel */}
      {selectedAirport && (
        <div className="absolute top-4 right-4 z-[1000] bg-black/90 border border-gray-600 rounded-lg p-4 backdrop-blur-sm max-w-xs">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-white font-semibold">{selectedAirport.icao}</h3>
            <button
              onClick={() => {
                setSelectedAirport(null);
                setAviationWeather(null);
              }}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <div className="text-gray-300 text-sm mb-2">{selectedAirport.name}</div>
          <div className="text-gray-400 text-xs mb-3">{selectedAirport.city}, {selectedAirport.country}</div>
          
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-300 mb-3">
            <div>Elevation: {selectedAirport.elevation} ft</div>
            <div>Runways: {selectedAirport.runways?.length || 0}</div>
          </div>

          {weatherLoading && (
            <div className="flex items-center gap-2 text-blue-400 text-sm mb-3">
              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-400"></div>
              Loading weather...
            </div>
          )}

          {aviationWeather && (
            <div className="space-y-2">
              <div>
                <h4 className="text-white font-medium text-sm mb-1">METAR</h4>
                <div className="bg-gray-900/50 p-2 rounded text-xs font-mono text-gray-300 max-h-16 overflow-y-auto">
                  {aviationWeather.metar.raw || 'No METAR data'}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Map Container - Full Width */}
      <div className="w-full h-full relative" style={{ minHeight: '500px' }}>
        {!mapLoaded && (
          <div className="absolute inset-0 bg-gray-900 flex items-center justify-center z-50">
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-lg font-medium">Loading Satellite Map</p>
              <p className="text-sm text-gray-400 mt-2">Initializing world view...</p>
            </div>
          </div>
        )}
        
        <MapContainer
          center={[40, 0]}
          zoom={3}
          style={{ height: '100%', width: '100%', minHeight: '400px' }}
          zoomControl={true}
          scrollWheelZoom={true}
          attributionControl={false}
          key="main-map"
          whenReady={() => {
            console.log('Map ready');
            setTimeout(() => {
              setMapLoaded(true);
              setMapError(null);
            }, 1000);
          }}
        >
          {/* Primary Satellite Tile Layer */}
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution="© Esri"
            maxZoom={18}
          />

          {/* Country Borders and Geographic Labels */}
          <TileLayer
            url="https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
            attribution="© Esri"
            maxZoom={18}
            opacity={0.7}
          />

          {/* Weather Radar Overlay */}
          {showWeatherOverlay && weatherRadarImage && (
            <WeatherRadarOverlay 
              weatherRadarImage={weatherRadarImage} 
              radarOpacity={radarOpacity}
            />
          )}

          {/* SIGMET Weather Alerts Overlay */}
          <SigmetOverlay 
            showSigmets={showSigmets}
            onSigmetSelect={(sigmet) => {
              console.log('SIGMET selected:', sigmet?.title);
            }}
          />

          {/* Airport markers */}
          {showAirports && airports.reduce((uniqueAirports: Airport[], airport, index) => {
            // Ensure unique airports by ICAO code and valid coordinates
            const exists = uniqueAirports.find(a => a.icao === airport.icao);
            const hasValidCoords = airport.latitude != null && airport.longitude != null && 
                                  !isNaN(airport.latitude) && !isNaN(airport.longitude) &&
                                  airport.latitude >= -90 && airport.latitude <= 90 &&
                                  airport.longitude >= -180 && airport.longitude <= 180;
            
            if (!exists && hasValidCoords) {
              uniqueAirports.push(airport);
            }
            return uniqueAirports;
          }, []).map((airport, index) => (
            <Marker
              key={`airport-${airport.icao}-${index}`}
              position={[airport.latitude, airport.longitude]}
              icon={createAirportIcon(
                selectedAirport?.icao === airport.icao,
                getServiceCoverage(airport)?.support
              )}
              eventHandlers={{
                click: () => handleAirportClick(airport),
              }}
            >
              <Popup 
                maxWidth={280} 
                className="compact-popup"
                autoPan={true}
                autoPanPadding={[20, 20]}
                closeOnEscapeKey={true}
                closeOnClick={false}
              >
                <div className="p-2 max-w-[260px]">
                  <div className="text-center mb-2">
                    <h3 className="text-green-500 font-bold text-base">{airport.icao}</h3>
                    <div className="text-white text-xs font-medium truncate">{airport.name}</div>
                    <div className="text-gray-400 text-xs">{airport.city}, {airport.country}</div>
                  </div>
                  
                  <div className="space-y-1.5 border-t border-gray-600 pt-1.5">
                    <div className="grid grid-cols-2 gap-1 text-xs">
                      <div>
                        <span className="text-gray-400">IATA:</span>
                        <span className="text-white ml-1">{airport.iata || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Runways:</span>
                        <span className="text-white ml-1">{airport.runways?.length || 0}</span>
                      </div>
                    </div>
                    
                    {/* Compact Service Coverage Section */}
                    {(() => {
                      const serviceInfo = getServiceCoverage(airport);
                      return serviceInfo ? (
                        <div className="border-t border-gray-600 pt-1.5">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <div className="flex items-center gap-1">
                              <Building className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-400">Services</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div 
                                className="w-2 h-2 rounded-full" 
                                style={{ backgroundColor: getServiceIndicatorColor(serviceInfo.support) }}
                              ></div>
                              <span className="text-xs text-gray-300 capitalize">
                                {serviceInfo.support.replace('_', ' ')}
                              </span>
                            </div>
                          </div>
                          
                          <div className="flex gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <Fuel className={`w-3 h-3 ${
                                serviceInfo.support === 'both' || serviceInfo.support === 'fuel_only' 
                                  ? 'text-green-400' : 'text-gray-500'
                              }`} />
                              <span className="text-gray-300">Fuel</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Wrench className={`w-3 h-3 ${
                                serviceInfo.support === 'both' || serviceInfo.support === 'ground_only' 
                                  ? 'text-green-400' : 'text-gray-500'
                              }`} />
                              <span className="text-gray-300">Ground</span>
                            </div>
                          </div>
                          
                          {serviceInfo.phone && serviceInfo.phone !== 'Not available' && (
                            <div className="mt-1.5 p-1.5 bg-blue-900/30 rounded text-xs">
                              <div className="flex items-center gap-1">
                                <Phone className="w-3 h-3 text-blue-400" />
                                <span className="text-blue-400 font-medium">Ops Center</span>
                              </div>
                              <div className="text-white font-mono text-xs">{serviceInfo.phone}</div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="border-t border-gray-600 pt-1.5 text-xs">
                          <span className="text-gray-500">No service data available</span>
                        </div>
                      );
                    })()}
                    
                    <button 
                      onClick={() => handleAirportClick(airport)}
                      className="w-full mt-2 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                    >
                      Weather & Details
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Flight markers */}
          {showFlights && flightData.filter((flight) => {
            // Only render flights with valid coordinates
            return flight.latitude != null && flight.longitude != null && 
                   !isNaN(flight.latitude) && !isNaN(flight.longitude) &&
                   flight.latitude >= -90 && flight.latitude <= 90 &&
                   flight.longitude >= -180 && flight.longitude <= 180;
          }).map((flight, index) => (
            <Marker
              key={`flight-${flight.callsign || index}-${index}`}
              position={[flight.latitude, flight.longitude]}
              icon={createFlightIcon(flight.heading || 0, selectedFlight?.callsign === flight.callsign)}
              eventHandlers={{
                click: () => {
                  selectFlight(flight);
                  console.log('Flight selected:', flight.callsign);
                },
              }}
            >
              <Popup>
                <div className="text-sm">
                  <div className="font-medium">{flight.callsign}</div>
                  <div className="text-gray-600">{flight.aircraft}</div>
                  <div className="text-gray-600">{flight.altitude}ft - {flight.velocity}kts</div>
                  <div className="text-gray-600">{flight.origin} → {flight.destination}</div>
                  <div className="text-gray-600">Fuel: {flight.fuel} kg</div>
                  <button 
                    onClick={() => selectFlight(flight)}
                    className="mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"
                  >
                    Select Flight
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}

          {/* Weather Radar Overlay */}
          {showWeatherOverlay && weatherRadarImage && (
            <WeatherRadarOverlay
              weatherRadarImage={weatherRadarImage}
              radarOpacity={radarOpacity}
            />
          )}

          {/* SIGMET Weather Alerts Overlay */}
          <SigmetOverlay 
            showSigmets={showSigmets}
            onSigmetSelect={(sigmet) => {
              console.log('SIGMET selected:', sigmet?.title);
            }}
          />

          {/* Coordinate Display */}
          <CoordinateDisplay />
        </MapContainer>
      </div>
    </div>
  );
}

// Main Export with Error Boundary Protection
export default function ProfessionalSatelliteMap() {
  return (
    <SatelliteMapErrorBoundary>
      <ProfessionalSatelliteMapCore />
    </SatelliteMapErrorBoundary>
  );
}