import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Plane, Info, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

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
      width: 12px; 
      height: 12px; 
      background: ${selected ? '#fbbf24' : '#3b82f6'}; 
      border: 2px solid ${selected ? '#f59e0b' : '#1d4ed8'};
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    ">
      <div style="color: white; font-size: 8px;">✈</div>
    </div>
  `,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
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

export default function LeafletSatelliteMap() {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [flightData, setFlightData] = useState<FlightPosition[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [aviationWeather, setAviationWeather] = useState<AviationWeatherData | null>(null);
  const [weatherLoading, setWeatherLoading] = useState(false);
  const [showAirports, setShowAirports] = useState(true);
  const [showFlights, setShowFlights] = useState(true);

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
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Airport Markers */}
        {showAirports && airports.map((airport) => (
          <Marker
            key={airport.icao}
            position={[airport.latitude, airport.longitude]}
            icon={createAirportIcon(selectedAirport?.icao === airport.icao)}
            eventHandlers={{
              click: () => handleAirportClick(airport),
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{airport.name}</div>
                <div className="text-gray-600">{airport.icao} - {airport.city}</div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Flight Markers */}
        {showFlights && flightData.map((flight) => (
          <Marker
            key={flight.callsign}
            position={[flight.latitude, flight.longitude]}
            icon={createFlightIcon(flight.heading, false)}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-medium">{flight.callsign}</div>
                <div className="text-gray-600">{flight.aircraft}</div>
                <div className="text-gray-600">{flight.altitude}ft - {flight.velocity}kts</div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}