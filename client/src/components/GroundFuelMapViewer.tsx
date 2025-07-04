import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface AirportData {
  icao: string;
  iata: string;
  name: string;
  country: string;
  hasGround: boolean;
  hasFuel: boolean;
  lat: number;
  lon: number;
  groundHandlers?: number;
  fuelSuppliers?: number;
}

export default function GroundFuelMapViewer() {
  const [airportData, setAirportData] = useState<AirportData[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchServiceData = async () => {
      try {
        // Fetch data from our backend APIs
        const [groundRes, fuelRes, airportsRes] = await Promise.all([
          fetch('/api/aviation/ground-handlers/all'),
          fetch('/api/aviation/fuel-suppliers/all'),
          fetch('/api/airports/major')
        ]);

        const [groundData, fuelData, airportsData] = await Promise.all([
          groundRes.json(),
          fuelRes.json(),
          airportsRes.json()
        ]);

        // Create a map of airport services
        const serviceMap: Record<string, AirportData> = {};

        // Add major airports as base
        if (airportsData.success) {
          airportsData.airports.forEach((airport: any) => {
            serviceMap[airport.icao] = {
              icao: airport.icao,
              iata: airport.iata || '',
              name: airport.name,
              country: airport.country,
              hasGround: false,
              hasFuel: false,
              lat: airport.latitude || 0,
              lon: airport.longitude || 0,
              groundHandlers: 0,
              fuelSuppliers: 0
            };
          });
        }

        // Add ground handling data
        if (groundData.success && groundData.handlers) {
          groundData.handlers.forEach((handler: any) => {
            const icao = handler.icao || handler.airport_icao;
            if (icao) {
              if (!serviceMap[icao]) {
                serviceMap[icao] = {
                  icao,
                  iata: handler.iata || '',
                  name: handler.airport_name || handler.name || icao,
                  country: handler.country || 'Unknown',
                  hasGround: true,
                  hasFuel: false,
                  lat: handler.latitude || 0,
                  lon: handler.longitude || 0,
                  groundHandlers: 1,
                  fuelSuppliers: 0
                };
              } else {
                serviceMap[icao].hasGround = true;
                serviceMap[icao].groundHandlers = (serviceMap[icao].groundHandlers || 0) + 1;
              }
            }
          });
        }

        // Add fuel supplier data
        if (fuelData.success && fuelData.suppliers) {
          fuelData.suppliers.forEach((supplier: any) => {
            const icao = supplier.icao || supplier.airport_icao;
            if (icao) {
              if (!serviceMap[icao]) {
                serviceMap[icao] = {
                  icao,
                  iata: supplier.iata || '',
                  name: supplier.airport_name || supplier.name || icao,
                  country: supplier.country || 'Unknown',
                  hasGround: false,
                  hasFuel: true,
                  lat: supplier.latitude || 0,
                  lon: supplier.longitude || 0,
                  groundHandlers: 0,
                  fuelSuppliers: 1
                };
              } else {
                serviceMap[icao].hasFuel = true;
                serviceMap[icao].fuelSuppliers = (serviceMap[icao].fuelSuppliers || 0) + 1;
              }
            }
          });
        }

        setAirportData(Object.values(serviceMap));
        setLoading(false);
      } catch (error) {
        console.error('Error loading service data:', error);
        setLoading(false);
      }
    };

    fetchServiceData();
  }, []);

  const filteredAirports = airportData.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'fuel') return a.hasFuel;
    if (filter === 'ground') return a.hasGround;
    if (filter === 'both') return a.hasFuel && a.hasGround;
    return true;
  });

  const getMarkerColor = (airport: AirportData) => {
    if (airport.hasFuel && airport.hasGround) return '#22c55e'; // Green - both services
    if (airport.hasFuel) return '#3b82f6'; // Blue - fuel only
    if (airport.hasGround) return '#f59e0b'; // Orange - ground only
    return '#6b7280'; // Gray - major airport without services
  };

  const createCustomMarker = (airport: AirportData) => {
    const color = getMarkerColor(airport);
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="background-color: ${color}; width: 12px; height: 12px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading global service coverage...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-sm border-b p-4 z-10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Global Diversion Support Coverage</h1>
            <p className="text-sm text-gray-600">Ground handlers and fuel suppliers worldwide</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm">
              <div className="w-3 h-3 rounded-full bg-green-500"></div>
              <span>Both Services</span>
              
              <div className="w-3 h-3 rounded-full bg-blue-500 ml-3"></div>
              <span>Fuel Only</span>
              
              <div className="w-3 h-3 rounded-full bg-amber-500 ml-3"></div>
              <span>Ground Only</span>
            </div>
            
            <select 
              value={filter} 
              onChange={e => setFilter(e.target.value)} 
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Airports ({airportData.length})</option>
              <option value="fuel">Fuel Suppliers ({airportData.filter(a => a.hasFuel).length})</option>
              <option value="ground">Ground Handlers ({airportData.filter(a => a.hasGround).length})</option>
              <option value="both">Complete Coverage ({airportData.filter(a => a.hasFuel && a.hasGround).length})</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 relative">
        <MapContainer 
          center={[20, 0]} 
          zoom={2} 
          scrollWheelZoom={true} 
          className="h-full w-full z-0"
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {filteredAirports.map((airport, index) => (
            airport.lat !== 0 && airport.lon !== 0 ? (
              <Marker 
                key={`${airport.icao}-${index}`} 
                position={[airport.lat, airport.lon]}
                icon={createCustomMarker(airport)}
              >
                <Popup>
                  <div className="text-sm">
                    <div className="font-semibold text-blue-900 mb-2">{airport.name}</div>
                    <div className="space-y-1">
                      <div><strong>ICAO:</strong> {airport.icao}</div>
                      {airport.iata && <div><strong>IATA:</strong> {airport.iata}</div>}
                      <div><strong>Country:</strong> {airport.country}</div>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`px-2 py-1 rounded text-xs ${airport.hasFuel ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-500'}`}>
                          Fuel: {airport.hasFuel ? `✅ (${airport.fuelSuppliers})` : '❌'}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${airport.hasGround ? 'bg-amber-100 text-amber-800' : 'bg-gray-100 text-gray-500'}`}>
                          Ground: {airport.hasGround ? `✅ (${airport.groundHandlers})` : '❌'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            ) : null
          ))}
        </MapContainer>

        {/* Stats Overlay */}
        <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg p-4 z-10 max-w-sm">
          <h3 className="font-semibold text-gray-900 mb-2">Coverage Statistics</h3>
          <div className="space-y-1 text-sm text-gray-600">
            <div>Total Airports: <span className="font-medium">{airportData.length}</span></div>
            <div>With Fuel Services: <span className="font-medium">{airportData.filter(a => a.hasFuel).length}</span></div>
            <div>With Ground Services: <span className="font-medium">{airportData.filter(a => a.hasGround).length}</span></div>
            <div>Complete Coverage: <span className="font-medium">{airportData.filter(a => a.hasFuel && a.hasGround).length}</span></div>
            <div>Currently Showing: <span className="font-medium">{filteredAirports.length}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}