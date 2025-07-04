import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import Papa from 'papaparse';
import L from 'leaflet';

interface AirportData {
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

export default function GroundFuelMapViewer() {
  const [airportData, setAirportData] = useState<AirportData[]>([]);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchCSVData = async () => {
      const res = await fetch('/top300_airport_support.csv');
      const text = await res.text();
      const parsed = Papa.parse(text, { header: true }).data as any[];
      const cleaned = parsed.map((entry: any) => ({
        icao: entry.ICAO,
        iata: entry.IATA,
        name: entry['Airport Name'],
        country: entry.Country,
        lat: parseFloat(entry.Latitude),
        lon: parseFloat(entry.Longitude),
        support: entry.Support.toLowerCase(),
        contact: entry.Contact || 'Not available',
        phone: entry.Phone || 'Not available'
      })).filter((a: AirportData) => !isNaN(a.lat) && !isNaN(a.lon));
      setAirportData(cleaned);
    };

    fetchCSVData();
  }, []);

  const filteredAirports = airportData.filter(a => {
    if (filter === 'all') return true;
    if (filter === 'fuel') return a.support === 'fuel_only' || a.support === 'both';
    if (filter === 'ground') return a.support === 'ground_only' || a.support === 'both';
    if (filter === 'both') return a.support === 'both';
    return true;
  });

  const getMarkerColor = (support: string) => {
    if (support === 'both') return '#22c55e'; // Green
    if (support === 'fuel_only') return '#3b82f6'; // Blue  
    if (support === 'ground_only') return '#f59e0b'; // Orange
    return '#ef4444'; // Red
  };

  return (
    <div className="h-screen w-full">
      <div className="p-4 flex gap-4 bg-white z-10 border-b">
        <h1 className="text-2xl font-bold text-gray-900">Global Airport Service Coverage</h1>
        <div className="flex gap-2 items-center ml-auto">
          <label className="text-sm font-medium">Filter:</label>
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)} 
            className="border p-2 rounded text-sm"
          >
            <option value="all">All Airports ({airportData.length})</option>
            <option value="fuel">Fuel Services ({airportData.filter(a => a.support === 'fuel_only' || a.support === 'both').length})</option>
            <option value="ground">Ground Handling ({airportData.filter(a => a.support === 'ground_only' || a.support === 'both').length})</option>
            <option value="both">Both Services ({airportData.filter(a => a.support === 'both').length})</option>
          </select>
        </div>
      </div>

      <MapContainer center={[20, 0]} zoom={2} scrollWheelZoom={true} className="h-full w-full z-0">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {filteredAirports.map((airport, index) => (
          <Marker 
            key={index} 
            position={[airport.lat, airport.lon]}
            icon={L.divIcon({
              className: 'custom-marker',
              html: `<div style="
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background-color: ${getMarkerColor(airport.support)};
                border: 2px solid white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              "></div>`,
              iconSize: [16, 16],
              iconAnchor: [8, 8]
            })}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold">{airport.name}</h3>
                <p className="text-sm text-gray-600">ICAO: {airport.icao}</p>
                <p className="text-sm text-gray-600">IATA: {airport.iata}</p>
                <p className="text-sm text-gray-600">Country: {airport.country}</p>
                <p className="text-sm font-medium mt-1">
                  Services: <span className={`px-2 py-1 rounded text-xs ${
                    airport.support === 'both' ? 'bg-green-100 text-green-800' :
                    airport.support === 'fuel_only' ? 'bg-blue-100 text-blue-800' :
                    airport.support === 'ground_only' ? 'bg-orange-100 text-orange-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {airport.support.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </p>
                {airport.contact && (
                  <p className="text-sm text-gray-600 mt-1">Contact: {airport.contact}</p>
                )}
                {airport.phone && (
                  <p className="text-sm text-gray-600">Phone: {airport.phone}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}