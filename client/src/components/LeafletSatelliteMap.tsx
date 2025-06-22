import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Plane, Info, X, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

// Error Boundary Component
class MapErrorBoundary extends React.Component<{children: React.ReactNode}, {hasError: boolean}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error('Map component error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center h-full bg-gray-900 text-white">
          <div className="text-center">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-yellow-500" />
            <h2 className="text-xl font-semibold mb-2">Map Loading Error</h2>
            <p className="text-gray-400 mb-4">Unable to load satellite map component</p>
            <Button 
              onClick={() => this.setState({ hasError: false })}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Retry
            </Button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Custom CSS for dark theme Leaflet popups and professional controls
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
  
  .leaflet-control-layers-toggle {
    background-color: rgba(42, 42, 42, 0.95) !important;
    border: 1px solid #555 !important;
    border-radius: 8px !important;
    color: #fff !important;
  }
  
  .leaflet-control-layers {
    background: rgba(42, 42, 42, 0.95) !important;
    border: 1px solid #555 !important;
    border-radius: 8px !important;
    color: #fff !important;
    backdrop-filter: blur(10px) !important;
  }
  
  .leaflet-control-layers-expanded {
    background: rgba(42, 42, 42, 0.95) !important;
    border: 1px solid #555 !important;
    color: #fff !important;
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

// Fix leaflet default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiMzMTY2ZjAiLz4KPHBhdGggZD0iTTEyLjUgMTZDMTQuNDMzMSAxNiAxNiAxNC40MzMxIDE2IDEyLjVDMTYgMTAuNTY2OSAxNC40MzMxIDkgMTIuNSA5QzEwLjU2NjkgOSA5IDEwLjU2NjkgOSAxMi41QzkgMTQuNDMzMSAxMC41NjY5IDE2IDEyLjUgMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
  iconUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjUiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCAyNSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHBhdGggZD0iTTEyLjUgMEMxOS40MDM2IDAgMjUgNS41OTY0NCAyNSAxMi41QzI1IDE5LjQwMzYgMTkuNDAzNiAyNSAxMi41IDI1QzUuNTk2NDQgMjUgMCAxOS40MDM2IDAgMTIuNUMwIDUuNTk2NDQgNS41OTY0NCAwIDEyLjUgMFoiIGZpbGw9IiMzMTY2ZjAiLz4KPHBhdGggZD0iTTEyLjUgMTZDMTQuNDMzMSAxNiAxNiAxNC40MzMxIDE2IDEyLjVDMTYgMTAuNTY2OSAxNC40MzMxIDkgMTIuNSA5QzEwLjU2NjkgOSA5IDEwLjU2NjkgOSAxMi41QzkgMTQuNDMzMSAxMC41NjY5IDE2IDEyLjUgMTZaIiBmaWxsPSJ3aGl0ZSIvPgo8L3N2Zz4K',
  shadowUrl: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDEiIGhlaWdodD0iNDEiIHZpZXdCb3g9IjAgMCA0MSA0MSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGVsbGlwc2UgY3g9IjIwLjUiIGN5PSIzNy41IiByeD0iMjAuNSIgcnk9IjMuNSIgZmlsbD0iYmxhY2siIGZpbGwtb3BhY2l0eT0iMC4zIi8+Cjwvc3ZnPgo=',
});

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

// Custom airport icon
const createAirportIcon = (selected: boolean) => L.divIcon({
  className: 'custom-airport-marker',
  html: `
    <div style="
      width: 16px; 
      height: 16px; 
      background: ${selected ? '#10b981' : '#3b82f6'}; 
      border: 2px solid ${selected ? '#059669' : '#1d4ed8'};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
      transition: all 0.3s ease;
    ">
      <div style="color: white; font-size: 10px; font-weight: bold;">✈</div>
    </div>
  `,
  iconSize: [20, 20],
  iconAnchor: [10, 10],
});

// Custom flight icon
const createFlightIcon = (heading: number, selected: boolean) => L.divIcon({
  className: 'custom-flight-marker',
  html: `
    <div style="
      transform: rotate(${heading}deg);
      color: ${selected ? '#fbbf24' : '#ef4444'};
      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
    ">
      ✈
    </div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

// Custom map event handler for coordinate display
function CoordinateDisplay() {
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 });
  const map = useMap();

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

// Weather Layer Manager Component
function WeatherLayerManager({ weatherLayers, weatherOpacity }: { 
  weatherLayers: any; 
  weatherOpacity: number; 
}) {
  const map = useMap();
  const overlayRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    // Create overlay container if it doesn't exist
    if (!overlayRef.current) {
      overlayRef.current = document.createElement('div');
      overlayRef.current.style.position = 'absolute';
      overlayRef.current.style.top = '0';
      overlayRef.current.style.left = '0';
      overlayRef.current.style.width = '100%';
      overlayRef.current.style.height = '100%';
      overlayRef.current.style.pointerEvents = 'none';
      overlayRef.current.style.zIndex = '1000';
      map.getContainer().appendChild(overlayRef.current);
    }

    // Clear existing overlays
    overlayRef.current.innerHTML = '';

    // Create weather overlays based on active layers
    if (weatherLayers.clouds) {
      const cloudsOverlay = document.createElement('div');
      cloudsOverlay.style.position = 'absolute';
      cloudsOverlay.style.top = '0';
      cloudsOverlay.style.left = '0';
      cloudsOverlay.style.width = '100%';
      cloudsOverlay.style.height = '100%';
      cloudsOverlay.style.background = `radial-gradient(circle at 20% 30%, rgba(255,255,255,${weatherOpacity * 0.7}) 0%, transparent 50%), radial-gradient(circle at 80% 60%, rgba(200,200,255,${weatherOpacity * 0.5}) 0%, transparent 40%)`;
      cloudsOverlay.style.pointerEvents = 'none';
      overlayRef.current.appendChild(cloudsOverlay);
    }

    if (weatherLayers.precipitation) {
      const precipOverlay = document.createElement('div');
      precipOverlay.style.position = 'absolute';
      precipOverlay.style.top = '0';
      precipOverlay.style.left = '0';
      precipOverlay.style.width = '100%';
      precipOverlay.style.height = '100%';
      precipOverlay.style.background = `radial-gradient(circle at 40% 20%, rgba(0,100,255,${weatherOpacity * 0.6}) 0%, transparent 30%), radial-gradient(circle at 70% 80%, rgba(0,150,255,${weatherOpacity * 0.4}) 0%, transparent 25%)`;
      precipOverlay.style.pointerEvents = 'none';
      overlayRef.current.appendChild(precipOverlay);
    }

    if (weatherLayers.wind) {
      const windOverlay = document.createElement('div');
      windOverlay.style.position = 'absolute';
      windOverlay.style.top = '0';
      windOverlay.style.left = '0';
      windOverlay.style.width = '100%';
      windOverlay.style.height = '100%';
      windOverlay.style.background = `linear-gradient(45deg, rgba(0,255,0,${weatherOpacity * 0.3}) 0%, transparent 50%), linear-gradient(-45deg, rgba(100,255,100,${weatherOpacity * 0.2}) 0%, transparent 50%)`;
      windOverlay.style.pointerEvents = 'none';
      overlayRef.current.appendChild(windOverlay);
    }

    if (weatherLayers.temperature) {
      const tempOverlay = document.createElement('div');
      tempOverlay.style.position = 'absolute';
      tempOverlay.style.top = '0';
      tempOverlay.style.left = '0';
      tempOverlay.style.width = '100%';
      tempOverlay.style.height = '100%';
      tempOverlay.style.background = `radial-gradient(circle at 60% 40%, rgba(255,100,0,${weatherOpacity * 0.4}) 0%, transparent 40%), radial-gradient(circle at 30% 70%, rgba(255,200,0,${weatherOpacity * 0.3}) 0%, transparent 35%)`;
      tempOverlay.style.pointerEvents = 'none';
      overlayRef.current.appendChild(tempOverlay);
    }

    if (weatherLayers.pressure) {
      const pressureOverlay = document.createElement('div');
      pressureOverlay.style.position = 'absolute';
      pressureOverlay.style.top = '0';
      pressureOverlay.style.left = '0';
      pressureOverlay.style.width = '100%';
      pressureOverlay.style.height = '100%';
      pressureOverlay.style.background = `radial-gradient(circle at 50% 50%, rgba(255,0,255,${weatherOpacity * 0.3}) 0%, transparent 60%)`;
      pressureOverlay.style.pointerEvents = 'none';
      overlayRef.current.appendChild(pressureOverlay);
    }

    return () => {
      if (overlayRef.current && overlayRef.current.parentNode) {
        overlayRef.current.parentNode.removeChild(overlayRef.current);
        overlayRef.current = null;
      }
    };
  }, [weatherLayers, weatherOpacity, map]);

  return null;
}

// Professional Weather Controls Component
function WeatherControlsPanel({ 
  showWeatherPanel, 
  setShowWeatherPanel, 
  weatherLayers, 
  setWeatherLayers, 
  weatherOpacity, 
  setWeatherOpacity 
}: {
  showWeatherPanel: boolean;
  setShowWeatherPanel: (show: boolean) => void;
  weatherLayers: any;
  setWeatherLayers: (layers: any) => void;
  weatherOpacity: number;
  setWeatherOpacity: (opacity: number) => void;
}) {
  const weatherLayerData = {
    clouds: { icon: '☁️', label: 'Clouds' },
    precipitation: { icon: '🌧️', label: 'Precipitation' },
    wind: { icon: '💨', label: 'Wind Speed' },
    pressure: { icon: '📊', label: 'Pressure' },
    temperature: { icon: '🌡️', label: 'Temperature' },
    turbulence: { icon: '⚡', label: 'Turbulence (Simulated)' }
  };

  return (
    <>


      {showWeatherPanel && (
        <div 
          className="absolute top-4 right-32 z-[1000] bg-black/90 border border-gray-600 rounded-lg p-4 min-w-[200px] backdrop-blur-sm"
          style={{ 
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            animation: 'slideIn 0.3s ease'
          }}
        >
          <div className="text-green-400 font-bold mb-3 text-sm">Aviation Weather</div>
          
          <div className="space-y-2 mb-4">
            {Object.entries(weatherLayerData).map(([key, data]) => (
              <label
                key={key}
                className="flex items-center cursor-pointer p-1 rounded hover:bg-white/10 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={weatherLayers[key as keyof typeof weatherLayers]}
                  onChange={(e) => {
                    setWeatherLayers((prev: any) => ({
                      ...prev,
                      [key]: e.target.checked
                    }));
                  }}
                  className="mr-2 accent-green-500"
                />
                <span className="text-xs text-white select-none">
                  {data.icon} {data.label}
                </span>
              </label>
            ))}
          </div>
          
          <div className="border-t border-gray-600 pt-3">
            <label className="block text-xs text-gray-300 mb-2">Opacity</label>
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={weatherOpacity}
              onChange={(e) => setWeatherOpacity(parseFloat(e.target.value))}
              className="w-full mb-1 accent-green-500"
            />
            <span className="text-xs text-gray-400">
              {Math.round(weatherOpacity * 100)}%
            </span>
          </div>
        </div>
      )}
    </>
  );
}

function LeafletSatelliteMapCore() {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [flightData, setFlightData] = useState<any[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [aviationWeather, setAviationWeather] = useState<AviationWeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [showAirports, setShowAirports] = useState(true);
  const [showFlights, setShowFlights] = useState(true);
  
  // Weather controls state
  const [showWeatherPanel, setShowWeatherPanel] = useState(false);
  const [weatherLayers, setWeatherLayers] = useState({
    clouds: false,
    precipitation: false,
    wind: false,
    pressure: false,
    temperature: false,
    turbulence: false
  });
  const [weatherOpacity, setWeatherOpacity] = useState(0.6);
  const [searchTerm, setSearchTerm] = useState('');

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
          setAirports(data.airports);
        }
      } catch (error) {
        console.error('Failed to fetch airports:', error);
      }
    };

    fetchAirports();
  }, []);

  // Load flight data
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

  // Handle airport click for weather data
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
    <div className="relative w-full h-full">
      {/* Control Panel */}
      <div className="absolute top-4 left-4 z-[1000] space-y-4">
        <Card className="w-80 bg-black/80 backdrop-blur-sm border-gray-600">
          <CardHeader className="pb-3">
            <CardTitle className="text-white flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Satellite Overview
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <h4 className="text-white text-sm font-medium">Display Layers</h4>
              
              <div className="flex items-center justify-between">
                <label className="text-white text-sm flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Major Airports
                </label>
                <Switch 
                  checked={showAirports} 
                  onCheckedChange={setShowAirports}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <label className="text-white text-sm flex items-center gap-2">
                  <Plane className="h-4 w-4" />
                  Flight Paths
                </label>
                <Switch 
                  checked={showFlights} 
                  onCheckedChange={setShowFlights}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weather Panel */}
      {selectedAirport && (
        <div className="absolute bottom-4 right-4 z-[1000] w-96">
          <Card className="bg-black/90 backdrop-blur-sm border-gray-600">
            <CardHeader className="pb-3">
              <CardTitle className="text-white flex items-center justify-between">
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
                  className="text-white hover:bg-gray-700"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-sm text-gray-300">
                <div>City: {selectedAirport.city}</div>
                <div>Country: {selectedAirport.country}</div>
                <div>Elevation: {selectedAirport.elevation} ft</div>
                <div>Runways: {selectedAirport.runways.join(', ')}</div>
              </div>

              {weatherLoading && (
                <div className="flex items-center gap-2 text-blue-400">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-400"></div>
                  Loading aviation weather data...
                </div>
              )}

              {aviationWeather && (
                <div className="space-y-3">
                  <div>
                    <h4 className="text-white font-medium mb-2">METAR</h4>
                    <div className="bg-gray-900/50 p-2 rounded text-xs font-mono text-gray-300">
                      {aviationWeather.metar.raw || 'No METAR data available'}
                    </div>
                  </div>
                  <div>
                    <h4 className="text-white font-medium mb-2">TAF</h4>
                    <div className="bg-gray-900/50 p-2 rounded text-xs font-mono text-gray-300">
                      {aviationWeather.taf.raw || 'No TAF data available'}
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Map */}
      <MapContainer
        center={[40, 0]}
        zoom={3}
        style={{ height: '100%', width: '100%' }}
        zoomControl={true}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='© Esri, Maxar, Earthstar Geographics'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          maxZoom={18}
        />

        {/* Airport Markers */}
        {showAirports && filteredAirports.reduce((uniqueAirports: any[], airport, index) => {
          // Ensure unique airports by ICAO code
          const exists = uniqueAirports.find(a => a.icao === airport.icao);
          if (!exists) {
            uniqueAirports.push(airport);
          }
          return uniqueAirports;
        }, []).map((airport, index) => (
          <Marker
            key={`${airport.icao}-${index}`}
            position={[airport.latitude, airport.longitude]}
            icon={createAirportIcon(selectedAirport?.icao === airport.icao)}
            eventHandlers={{
              click: () => handleAirportClick(airport),
            }}
          >
            <Popup>
              <div className="text-center p-2">
                <h3 className="text-green-500 font-bold text-lg mb-2">{airport.icao}</h3>
                <div className="text-white text-sm mb-1">{airport.name}</div>
                <div className="text-gray-400 text-xs">{airport.city}, {airport.country}</div>
                <div className="text-gray-500 text-xs mt-2">
                  {airport.latitude.toFixed(4)}, {airport.longitude.toFixed(4)}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Flight Markers */}
        {showFlights && flightData.map((flight: any, index) => (
          <Marker
            key={`flight-${flight.flight_number || flight.callsign || index}`}
            position={[flight.latitude || 0, flight.longitude || 0]}
            icon={createFlightIcon(flight.heading || 0, false)}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{flight.flight_number || flight.callsign}</div>
                <div className="text-gray-600">{flight.aircraft_type || flight.aircraft}</div>
                <div className="text-gray-600">{flight.altitude || 0}ft - {flight.speed || flight.velocity || 0}kts</div>
                {flight.route && (
                  <div className="text-gray-500 text-xs mt-1">{flight.route}</div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Weather Layer Manager */}
        <WeatherLayerManager weatherLayers={weatherLayers} weatherOpacity={weatherOpacity} />

        {/* Coordinate Display */}
        <CoordinateDisplay />
      </MapContainer>

      {/* Professional Weather Controls */}
      <WeatherControlsPanel 
        showWeatherPanel={showWeatherPanel}
        setShowWeatherPanel={setShowWeatherPanel}
        weatherLayers={weatherLayers}
        setWeatherLayers={setWeatherLayers}
        weatherOpacity={weatherOpacity}
        setWeatherOpacity={setWeatherOpacity}
      />
    </div>
  );
}

// Weather Controls Hook for sharing state
function useWeatherControls() {
  const [showWeatherPanel, setShowWeatherPanel] = useState(false);
  const [weatherLayers, setWeatherLayers] = useState({
    clouds: false,
    precipitation: false,
    wind: false,
    pressure: false,
    temperature: false,
    turbulence: false
  });
  const [weatherOpacity, setWeatherOpacity] = useState(0.6);

  return {
    showWeatherPanel,
    setShowWeatherPanel,
    weatherLayers,
    setWeatherLayers,
    weatherOpacity,
    setWeatherOpacity
  };
}

// Main Export with Error Boundary
export default function LeafletSatelliteMap() {
  return (
    <MapErrorBoundary>
      <LeafletSatelliteMapCore />
    </MapErrorBoundary>
  );
}