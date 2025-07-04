import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers
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
        // Use the corrected airport support API for accurate data
        const correctedRes = await fetch('/api/aviation/airport-support/corrected');
        
        if (!correctedRes.ok) {
          console.error('Failed to fetch corrected data, falling back to individual APIs');
          await processLegacyData();
          return;
        }
        
        const correctedData = await correctedRes.json();
        
        if (correctedData.success && correctedData.airports) {
          // Use corrected data directly
          setAirportData(correctedData.airports.map((airport: any) => ({
            icao: airport.icao,
            iata: airport.iata,
            name: airport.airportName,
            country: airport.country,
            hasGround: airport.hasGround,
            hasFuel: airport.hasFuel,
            lat: airport.latitude,
            lon: airport.longitude,
            groundHandlers: airport.groundHandlers,
            fuelSuppliers: airport.fuelSuppliers
          })));
          
          console.log(`Loaded ${correctedData.airports.length} airports with corrected service data`);
          setLoading(false);
          return;
        }
        
        throw new Error('Corrected data format invalid');
      } catch (error) {
        console.error('Error fetching corrected service data:', error);
        await processLegacyData();
      }
    };
    
    const processLegacyData = async () => {
      try {
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
    return '#ef4444'; // Red - no services
  };

  const createCustomIcon = (color: string) => {
    return L.divIcon({
      className: 'custom-marker',
      html: `<div style="
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background-color: ${color};
        border: 2px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      "></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b p-4">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Global Airport Service Coverage
          </h1>
          
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setFilter('all')}
                className={`px-4 py-2 rounded-md ${
                  filter === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                All Airports ({airportData.length})
              </button>
              <button
                onClick={() => setFilter('both')}
                className={`px-4 py-2 rounded-md ${
                  filter === 'both' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Both Services ({airportData.filter(a => a.hasFuel && a.hasGround).length})
              </button>
              <button
                onClick={() => setFilter('fuel')}
                className={`px-4 py-2 rounded-md ${
                  filter === 'fuel' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Fuel Services ({airportData.filter(a => a.hasFuel).length})
              </button>
              <button
                onClick={() => setFilter('ground')}
                className={`px-4 py-2 rounded-md ${
                  filter === 'ground' ? 'bg-orange-600 text-white' : 'bg-gray-200 text-gray-700'
                }`}
              >
                Ground Services ({airportData.filter(a => a.hasGround).length})
              </button>
            </div>
            
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <span>Both Services</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                <span>Fuel Only</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                <span>Ground Only</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[calc(100vh-120px)]">
        <MapContainer
          center={[30, 0]}
          zoom={2}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {filteredAirports.map((airport) => {
            if (!airport.lat || !airport.lon) return null;
            
            return (
              <Marker
                key={airport.icao}
                position={[airport.lat, airport.lon]}
                icon={createCustomIcon(getMarkerColor(airport))}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold text-lg">{airport.name}</h3>
                    <p className="text-gray-600">{airport.icao} / {airport.iata}</p>
                    <p className="text-gray-600">{airport.country}</p>
                    
                    <div className="mt-2 space-y-1">
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-3 h-3 rounded-full ${
                            airport.hasGround ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        ></div>
                        <span className="text-sm">
                          Ground Handling {airport.hasGround ? '✓' : '✗'}
                          {airport.groundHandlers ? ` (${airport.groundHandlers})` : ''}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <div 
                          className={`w-3 h-3 rounded-full ${
                            airport.hasFuel ? 'bg-green-500' : 'bg-red-500'
                          }`}
                        ></div>
                        <span className="text-sm">
                          Fuel Services {airport.hasFuel ? '✓' : '✗'}
                          {airport.fuelSuppliers ? ` (${airport.fuelSuppliers})` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}