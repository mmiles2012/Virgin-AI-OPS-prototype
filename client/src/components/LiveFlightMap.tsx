import { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Text } from '@react-three/drei';
import * as THREE from 'three';
import { Plane, MapPin, Navigation, Wifi } from 'lucide-react';

interface LiveFlight {
  flight_number: string;
  aircraft: string;
  departure: string;
  arrival: string;
  status: string;
  latitude?: number;
  longitude?: number;
  altitude?: number;
  speed?: number;
  heading?: number;
}

interface FlightData {
  flights_found: number;
  sample_flight: LiveFlight;
  all_flights?: LiveFlight[];
  api_credits_used: number;
}

// Major airports with real coordinates
const MAJOR_AIRPORTS = [
  { code: 'LAX', name: 'Los Angeles Intl', lat: 33.9425, lon: -118.4081 },
  { code: 'JFK', name: 'John F. Kennedy Intl', lat: 40.6413, lon: -73.7781 },
  { code: 'ORD', name: 'Chicago O\'Hare Intl', lat: 41.9742, lon: -87.9073 },
  { code: 'DFW', name: 'Dallas/Fort Worth Intl', lat: 32.8998, lon: -97.0403 },
  { code: 'DEN', name: 'Denver Intl', lat: 39.8561, lon: -104.6737 },
  { code: 'ATL', name: 'Atlanta Hartsfield-Jackson', lat: 33.6407, lon: -84.4277 },
  { code: 'SEA', name: 'Seattle-Tacoma Intl', lat: 47.4502, lon: -122.3088 },
  { code: 'LAS', name: 'Las Vegas McCarran', lat: 36.0840, lon: -115.1537 },
  { code: 'PHX', name: 'Phoenix Sky Harbor', lat: 33.4484, lon: -112.0740 },
  { code: 'MIA', name: 'Miami Intl', lat: 25.7959, lon: -80.2870 }
];

// Convert lat/lon to 3D coordinates for display
function latLonTo3D(lat: number, lon: number, scale: number = 10) {
  // Simple projection for continental US
  const x = (lon + 100) * scale; // Offset longitude for US centering
  const z = -(lat - 35) * scale;  // Offset latitude and invert Z for correct orientation
  return { x, y: 0.1, z };
}

function Airport({ airport, scale = 10 }: { airport: typeof MAJOR_AIRPORTS[0], scale?: number }) {
  const position = latLonTo3D(airport.lat, airport.lon, scale);
  
  return (
    <group position={[position.x, position.y, position.z]}>
      {/* Airport marker */}
      <mesh>
        <cylinderGeometry args={[0.5, 0.5, 0.2, 8]} />
        <meshBasicMaterial color="#60a5fa" />
      </mesh>
      {/* Airport code label */}
      <Text
        position={[0, 1, 0]}
        fontSize={0.8}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {airport.code}
      </Text>
    </group>
  );
}

function FlightMarker({ flight, scale = 10 }: { flight: LiveFlight, scale?: number }) {
  if (!flight.latitude || !flight.longitude) return null;
  
  const position = latLonTo3D(flight.latitude, flight.longitude, scale);
  
  return (
    <group position={[position.x, position.y + 0.5, position.z]}>
      {/* Flight aircraft marker */}
      <mesh rotation={[0, (flight.heading || 0) * Math.PI / 180, 0]}>
        <coneGeometry args={[0.3, 1, 4]} />
        <meshBasicMaterial color="#ef4444" />
      </mesh>
      {/* Flight number label */}
      <Text
        position={[0, 1.5, 0]}
        fontSize={0.6}
        color="#fbbf24"
        anchorX="center"
        anchorY="middle"
      >
        {flight.flight_number}
      </Text>
    </group>
  );
}

function MapTerrain({ scale = 10 }: { scale?: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useEffect(() => {
    if (meshRef.current) {
      // Create a simple terrain texture
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const ctx = canvas.getContext('2d')!;
      
      // Create gradient background resembling terrain
      const gradient = ctx.createLinearGradient(0, 0, 256, 256);
      gradient.addColorStop(0, '#1e3a8a');    // Ocean blue
      gradient.addColorStop(0.3, '#065f46');  // Dark green
      gradient.addColorStop(0.6, '#92400e');  // Brown
      gradient.addColorStop(1, '#374151');    // Gray
      
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
      
      // Add some terrain features
      ctx.fillStyle = '#047857';
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const size = Math.random() * 30 + 10;
        ctx.fillRect(x, y, size, size);
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.wrapS = THREE.RepeatWrapping;
      texture.wrapT = THREE.RepeatWrapping;
      
      if (meshRef.current.material instanceof THREE.MeshBasicMaterial) {
        meshRef.current.material.map = texture;
        meshRef.current.material.needsUpdate = true;
      }
    }
  }, []);
  
  return (
    <mesh ref={meshRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
      <planeGeometry args={[scale * 20, scale * 15]} />
      <meshBasicMaterial color="#2563eb" />
    </mesh>
  );
}

export default function LiveFlightMap() {
  const [flightData, setFlightData] = useState<FlightData | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [mapScale, setMapScale] = useState(10);

  const fetchLiveFlights = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/aviation/virgin-atlantic-flights');
      const data = await response.json();
      
      if (data.success) {
        setFlightData(data.data);
        setLastUpdate(new Date());
      }
    } catch (error) {
      console.error('Error fetching flight data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLiveFlights();
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(fetchLiveFlights, 45000); // Refresh every 45 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoRefresh]);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="bg-gray-900/90 backdrop-blur-sm rounded-lg border border-gray-700 p-6 h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Navigation className="h-6 w-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">Live Flight Map</h2>
          {loading && <Wifi className="h-4 w-4 text-blue-400 animate-pulse" />}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1 rounded text-sm transition-colors ${
              autoRefresh 
                ? 'bg-green-600 text-white hover:bg-green-700' 
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {autoRefresh ? 'Live' : 'Manual'}
          </button>
          <button
            onClick={fetchLiveFlights}
            disabled={loading}
            className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 text-sm transition-colors"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="flex items-center gap-4 text-gray-400">
          <span>Flights: {flightData?.flights_found || 0}</span>
          <span>Scale: 1:{mapScale}</span>
          {lastUpdate && <span>Updated: {formatTime(lastUpdate)}</span>}
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
          <span className="text-blue-400 text-xs">Airports</span>
          <div className="w-2 h-2 bg-red-400 rounded-full ml-3"></div>
          <span className="text-red-400 text-xs">Aircraft</span>
        </div>
      </div>

      {/* 3D Map */}
      <div className="bg-black/50 rounded-lg border border-gray-600" style={{ height: 'calc(100% - 120px)' }}>
        <Canvas camera={{ position: [0, 15, 20], fov: 60 }}>
          <ambientLight intensity={0.4} />
          <directionalLight position={[10, 10, 5]} intensity={0.6} />
          
          {/* Terrain */}
          <MapTerrain scale={mapScale} />
          
          {/* Airports */}
          {MAJOR_AIRPORTS.map((airport) => (
            <Airport key={airport.code} airport={airport} scale={mapScale} />
          ))}
          
          {/* Live Flights */}
          {flightData?.sample_flight && (
            <FlightMarker flight={flightData.sample_flight} scale={mapScale} />
          )}
          
          {/* Additional flights if available */}
          {flightData?.all_flights?.map((flight, index) => (
            <FlightMarker key={index} flight={flight} scale={mapScale} />
          ))}
          
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={5}
            maxDistance={50}
          />
        </Canvas>
      </div>

      {/* Flight Info Panel */}
      {flightData?.sample_flight && (
        <div className="mt-4 bg-gray-800/50 rounded border border-gray-600 p-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plane className="h-4 w-4 text-blue-400" />
              <span className="text-white font-medium">
                {flightData.sample_flight.flight_number}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-300">{flightData.sample_flight.aircraft}</span>
            </div>
            <div className="text-sm text-gray-400">
              {flightData.sample_flight.departure} → {flightData.sample_flight.arrival}
            </div>
          </div>
          {flightData.sample_flight.latitude && (
            <div className="mt-2 grid grid-cols-4 gap-4 text-xs text-gray-400">
              <div>Lat: {flightData.sample_flight.latitude.toFixed(4)}°</div>
              <div>Lon: {flightData.sample_flight.longitude?.toFixed(4)}°</div>
              <div>Alt: {flightData.sample_flight.altitude?.toLocaleString() || 'N/A'} ft</div>
              <div>Speed: {flightData.sample_flight.speed || 'N/A'} kts</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}