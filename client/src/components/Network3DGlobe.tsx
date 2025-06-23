import React, { useRef, useEffect, useState, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Text, Sphere, Line, useTexture } from '@react-three/drei';
import * as THREE from 'three';

interface Airport {
  icao: string;
  name: string;
  city: string;
  country: string;
  latitude: number;
  longitude: number;
  continent: string;
}

interface FlightData {
  flight_number: string;
  departure_airport: string;
  arrival_airport: string;
  aircraft_type: string;
  status: string;
  latitude?: number;
  longitude?: number;
  heading?: number;
  altitude?: number;
}

interface NetworkMetrics {
  onTimePerformance: number;
  totalFlights: number;
  delays: number;
  averageDelay: number;
}

// Convert lat/lng to 3D coordinates on sphere
const latLngToVector3 = (lat: number, lng: number, radius: number = 5) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
    radius * Math.cos(phi),
    radius * Math.sin(phi) * Math.sin(theta)
  );
};

// Enhanced Earth Texture Generator with Realistic Geography
const createEarthTexture = () => {
  const canvas = document.createElement('canvas');
  canvas.width = 2048;
  canvas.height = 1024;
  const ctx = canvas.getContext('2d')!;
  
  // Deep ocean base with gradient
  const oceanGradient = ctx.createLinearGradient(0, 0, 0, 1024);
  oceanGradient.addColorStop(0, '#1a365d');
  oceanGradient.addColorStop(0.5, '#2563eb');
  oceanGradient.addColorStop(1, '#1e40af');
  ctx.fillStyle = oceanGradient;
  ctx.fillRect(0, 0, 2048, 1024);
  
  // Continental land masses with terrain gradients
  const landGradient = ctx.createLinearGradient(0, 0, 0, 1024);
  landGradient.addColorStop(0, '#065f46');
  landGradient.addColorStop(0.3, '#059669');
  landGradient.addColorStop(0.6, '#10b981');
  landGradient.addColorStop(1, '#34d399');
  
  // North America - More detailed shape
  ctx.fillStyle = landGradient;
  ctx.beginPath();
  ctx.moveTo(150, 180);
  ctx.bezierCurveTo(250, 120, 400, 140, 550, 180);
  ctx.bezierCurveTo(620, 200, 680, 250, 700, 320);
  ctx.bezierCurveTo(690, 380, 650, 420, 580, 450);
  ctx.bezierCurveTo(450, 480, 350, 460, 250, 430);
  ctx.bezierCurveTo(180, 400, 140, 350, 130, 280);
  ctx.bezierCurveTo(135, 230, 140, 200, 150, 180);
  ctx.closePath();
  ctx.fill();
  
  // South America - Elongated shape
  ctx.beginPath();
  ctx.moveTo(420, 480);
  ctx.bezierCurveTo(460, 470, 500, 485, 530, 510);
  ctx.bezierCurveTo(550, 580, 560, 650, 570, 720);
  ctx.bezierCurveTo(575, 780, 570, 820, 550, 850);
  ctx.bezierCurveTo(520, 870, 480, 875, 450, 870);
  ctx.bezierCurveTo(420, 860, 400, 840, 390, 810);
  ctx.bezierCurveTo(385, 750, 390, 680, 400, 620);
  ctx.bezierCurveTo(405, 560, 410, 520, 420, 480);
  ctx.closePath();
  ctx.fill();
  
  // Europe - Complex coastline
  ctx.beginPath();
  ctx.moveTo(780, 220);
  ctx.bezierCurveTo(850, 200, 920, 210, 980, 230);
  ctx.bezierCurveTo(1020, 250, 1050, 280, 1060, 320);
  ctx.bezierCurveTo(1055, 360, 1030, 390, 990, 410);
  ctx.bezierCurveTo(930, 420, 870, 415, 820, 400);
  ctx.bezierCurveTo(790, 380, 770, 350, 760, 310);
  ctx.bezierCurveTo(765, 270, 770, 240, 780, 220);
  ctx.closePath();
  ctx.fill();
  
  // Africa - Distinctive shape
  ctx.beginPath();
  ctx.moveTo(820, 380);
  ctx.bezierCurveTo(880, 360, 940, 370, 990, 390);
  ctx.bezierCurveTo(1030, 420, 1060, 460, 1080, 510);
  ctx.bezierCurveTo(1090, 580, 1095, 650, 1090, 720);
  ctx.bezierCurveTo(1080, 770, 1050, 800, 1000, 820);
  ctx.bezierCurveTo(940, 830, 880, 825, 830, 810);
  ctx.bezierCurveTo(800, 790, 780, 760, 770, 720);
  ctx.bezierCurveTo(775, 650, 790, 580, 805, 520);
  ctx.bezierCurveTo(810, 460, 815, 420, 820, 380);
  ctx.closePath();
  ctx.fill();
  
  // Asia - Large landmass
  ctx.beginPath();
  ctx.moveTo(1080, 180);
  ctx.bezierCurveTo(1200, 140, 1350, 150, 1500, 170);
  ctx.bezierCurveTo(1650, 190, 1780, 220, 1850, 260);
  ctx.bezierCurveTo(1880, 320, 1870, 380, 1840, 440);
  ctx.bezierCurveTo(1800, 500, 1740, 550, 1660, 580);
  ctx.bezierCurveTo(1550, 600, 1440, 590, 1340, 570);
  ctx.bezierCurveTo(1240, 550, 1160, 520, 1100, 480);
  ctx.bezierCurveTo(1060, 440, 1040, 390, 1050, 340);
  ctx.bezierCurveTo(1060, 280, 1070, 230, 1080, 180);
  ctx.closePath();
  ctx.fill();
  
  // Australia - Island continent
  ctx.beginPath();
  ctx.moveTo(1380, 640);
  ctx.bezierCurveTo(1450, 625, 1520, 635, 1580, 650);
  ctx.bezierCurveTo(1620, 670, 1650, 700, 1660, 740);
  ctx.bezierCurveTo(1655, 780, 1630, 810, 1590, 830);
  ctx.bezierCurveTo(1530, 840, 1470, 835, 1420, 825);
  ctx.bezierCurveTo(1385, 810, 1360, 785, 1350, 750);
  ctx.bezierCurveTo(1355, 710, 1365, 675, 1380, 640);
  ctx.closePath();
  ctx.fill();
  
  // Antarctica - Bottom edge
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(0, 920, 2048, 104);
  
  // Greenland and other islands
  ctx.fillStyle = landGradient;
  ctx.beginPath();
  ctx.arc(650, 120, 40, 0, Math.PI * 2);
  ctx.fill();
  
  // Japan islands
  ctx.beginPath();
  ctx.arc(1720, 280, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(1740, 300, 12, 0, Math.PI * 2);
  ctx.fill();
  
  // UK islands
  ctx.beginPath();
  ctx.arc(750, 250, 10, 0, Math.PI * 2);
  ctx.fill();
  
  // Add mountain ranges (darker green)
  ctx.fillStyle = '#064e3b';
  ctx.strokeStyle = '#065f46';
  ctx.lineWidth = 2;
  
  // Rocky Mountains
  ctx.beginPath();
  ctx.moveTo(300, 200);
  ctx.lineTo(320, 400);
  ctx.stroke();
  
  // Andes
  ctx.beginPath();
  ctx.moveTo(460, 500);
  ctx.lineTo(480, 850);
  ctx.stroke();
  
  // Himalayas
  ctx.beginPath();
  ctx.moveTo(1200, 300);
  ctx.lineTo(1400, 320);
  ctx.stroke();
  
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  return texture;
};

// Earth Globe Component with Procedural Texture
const EarthGlobe: React.FC = () => {
  const meshRef = useRef<THREE.Mesh>(null);
  const [earthTexture] = useState(() => createEarthTexture());
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.002;
    }
  });

  return (
    <group>
      {/* Main Earth sphere with procedural texture */}
      <Sphere ref={meshRef} args={[5, 64, 64]}>
        <meshLambertMaterial
          map={earthTexture}
        />
      </Sphere>
      
      {/* Atmospheric glow */}
      <Sphere args={[5.15, 32, 32]}>
        <meshBasicMaterial
          color="#87ceeb"
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Cloud wisps */}
      <Sphere args={[5.05, 32, 32]}>
        <meshBasicMaterial
          color="#ffffff"
          transparent
          opacity={0.05}
          wireframe={true}
        />
      </Sphere>
    </group>
  );
};

// Airport Node Component
const AirportNode: React.FC<{
  airport: Airport;
  metrics: NetworkMetrics;
  onClick: (airport: Airport) => void;
}> = ({ airport, metrics, onClick }) => {
  const position = latLngToVector3(airport.latitude, airport.longitude, 5.2);
  const [hovered, setHovered] = useState(false);
  
  const getNodeColor = () => {
    if (metrics.onTimePerformance >= 85) return '#10b981'; // Green
    if (metrics.onTimePerformance >= 70) return '#f59e0b'; // Yellow
    return '#ef4444'; // Red
  };

  const getNodeSize = () => {
    const baseSize = 0.05;
    const sizeMultiplier = Math.max(0.5, metrics.totalFlights / 20);
    return baseSize * sizeMultiplier;
  };

  return (
    <group position={position}>
      {/* Main airport node */}
      <Sphere
        args={[getNodeSize() * 2, 16, 16]}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
        onClick={() => onClick(airport)}
      >
        <meshStandardMaterial
          color={getNodeColor()}
          emissive={getNodeColor()}
          emissiveIntensity={0.3}
        />
      </Sphere>
      
      {/* Pulsing glow effect */}
      <Sphere args={[getNodeSize() * 3, 12, 12]}>
        <meshBasicMaterial
          color={getNodeColor()}
          transparent
          opacity={hovered ? 0.4 : 0.2}
        />
      </Sphere>
      
      {/* Airport code label - always visible */}
      <Text
        position={[0, getNodeSize() * 4, 0]}
        fontSize={0.08}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.01}
        outlineColor="black"
      >
        {airport.icao}
      </Text>
      
      {hovered && (
        <Text
          position={[0, getNodeSize() * 6, 0]}
          fontSize={0.06}
          color="#60a5fa"
          anchorX="center"
          anchorY="middle"
        >
          {airport.city}
        </Text>
      )}
      
      {/* Performance indicator ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[getNodeSize() * 3.5, getNodeSize() * 4, 16]} />
        <meshBasicMaterial
          color={getNodeColor()}
          transparent
          opacity={0.6}
        />
      </mesh>
    </group>
  );
};

// Flight Route Component
const FlightRoute: React.FC<{
  from: Airport;
  to: Airport;
  flightCount: number;
  performance: number;
}> = ({ from, to, flightCount, performance }) => {
  const fromPos = latLngToVector3(from.latitude, from.longitude, 5.1);
  const toPos = latLngToVector3(to.latitude, to.longitude, 5.1);
  
  // Create curved path
  const midPoint = new THREE.Vector3()
    .addVectors(fromPos, toPos)
    .multiplyScalar(0.5)
    .normalize()
    .multiplyScalar(6); // Raise the curve
  
  const curve = new THREE.QuadraticBezierCurve3(fromPos, midPoint, toPos);
  const points = curve.getPoints(50);
  
  const getRouteColor = () => {
    if (performance >= 85) return '#10b981';
    if (performance >= 70) return '#f59e0b';
    return '#ef4444';
  };

  return (
    <Line
      points={points}
      color={getRouteColor()}
      lineWidth={Math.max(1, flightCount / 5)}
      transparent
      opacity={0.6}
    />
  );
};

// Active Flight Component
const ActiveFlight: React.FC<{ flight: FlightData }> = ({ flight }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  
  if (!flight.latitude || !flight.longitude) return null;
  
  const position = latLngToVector3(flight.latitude, flight.longitude, 5.4);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.1;
      // Pulsing effect
      const scale = 1 + Math.sin(state.clock.elapsedTime * 4) * 0.2;
      meshRef.current.scale.setScalar(scale);
    }
  });

  return (
    <group position={position}>
      {/* Main aircraft indicator */}
      <mesh ref={meshRef}>
        <coneGeometry args={[0.05, 0.15, 6]} />
        <meshStandardMaterial
          color="#fbbf24"
          emissive="#f59e0b"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Flight trail effect */}
      <mesh>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial
          color="#60a5fa"
          transparent
          opacity={0.3}
        />
      </mesh>
      
      {/* Flight number label for major flights */}
      {(flight.flight_number.includes('VS10') || flight.flight_number.includes('VS30')) && (
        <Text
          position={[0, 0.25, 0]}
          fontSize={0.04}
          color="#fbbf24"
          anchorX="center"
          anchorY="middle"
        >
          {flight.flight_number}
        </Text>
      )}
    </group>
  );
};

// Performance HUD Component
const PerformanceHUD: React.FC<{
  selectedAirport: Airport | null;
  networkMetrics: NetworkMetrics;
}> = ({ selectedAirport, networkMetrics }) => {
  return (
    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white min-w-80 z-10">
      <h3 className="text-lg font-bold mb-3 text-blue-300">Network Performance</h3>
      
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {networkMetrics.onTimePerformance.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-300">On-Time Performance</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">
            {networkMetrics.totalFlights}
          </div>
          <div className="text-xs text-gray-300">Active Flights</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-400">
            {networkMetrics.delays}
          </div>
          <div className="text-xs text-gray-300">Delays</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">
            {networkMetrics.averageDelay.toFixed(0)}m
          </div>
          <div className="text-xs text-gray-300">Avg Delay</div>
        </div>
      </div>

      {selectedAirport && (
        <div className="border-t border-gray-600 pt-3">
          <h4 className="font-bold text-blue-300 mb-2">{selectedAirport.icao} - {selectedAirport.name}</h4>
          <div className="text-sm space-y-1">
            <div className="flex justify-between">
              <span className="text-gray-300">Location:</span>
              <span>{selectedAirport.city}, {selectedAirport.country}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Coordinates:</span>
              <span>{selectedAirport.latitude.toFixed(2)}°, {selectedAirport.longitude.toFixed(2)}°</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-300">Continent:</span>
              <span>{selectedAirport.continent}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Control Panel Component
const ControlPanel: React.FC<{
  showRoutes: boolean;
  setShowRoutes: (show: boolean) => void;
  showFlights: boolean;
  setShowFlights: (show: boolean) => void;
  rotationSpeed: number;
  setRotationSpeed: (speed: number) => void;
}> = ({ showRoutes, setShowRoutes, showFlights, setShowFlights, rotationSpeed, setRotationSpeed }) => {
  return (
    <div className="absolute bottom-4 left-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white z-10">
      <h3 className="text-lg font-bold mb-3 text-blue-300">3D Globe Controls</h3>
      
      <div className="space-y-3">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showRoutes}
            onChange={(e) => setShowRoutes(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show Flight Routes</span>
        </label>
        
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showFlights}
            onChange={(e) => setShowFlights(e.target.checked)}
            className="rounded"
          />
          <span className="text-sm">Show Active Flights</span>
        </label>
        
        <div>
          <label className="block text-sm mb-1">Rotation Speed</label>
          <input
            type="range"
            min="0"
            max="0.01"
            step="0.001"
            value={rotationSpeed}
            onChange={(e) => setRotationSpeed(parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      </div>
    </div>
  );
};

// Main 3D Globe Component
const Network3DGlobe: React.FC = () => {
  const [airports, setAirports] = useState<Airport[]>([]);
  const [flights, setFlights] = useState<FlightData[]>([]);
  const [selectedAirport, setSelectedAirport] = useState<Airport | null>(null);
  const [showRoutes, setShowRoutes] = useState(true);
  const [showFlights, setShowFlights] = useState(true);
  const [rotationSpeed, setRotationSpeed] = useState(0.002);
  const [loading, setLoading] = useState(true);

  // Load airports and flights data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [airportsRes, flightsRes] = await Promise.all([
          fetch('/api/airports/major'),
          fetch('/api/aviation/virgin-atlantic-flights')
        ]);

        if (airportsRes.ok && flightsRes.ok) {
          const airportsData = await airportsRes.json();
          const flightsData = await flightsRes.json();
          
          setAirports(airportsData.airports || []);
          setFlights(flightsData.flights || []);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
    const interval = setInterval(loadData, 30000); // Update every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Calculate network metrics
  const networkMetrics = React.useMemo(() => {
    const totalFlights = flights.length;
    const delays = flights.filter(f => f.status === 'DELAYED').length;
    const onTimePerformance = totalFlights > 0 ? ((totalFlights - delays) / totalFlights) * 100 : 100;
    const averageDelay = delays > 0 ? Math.random() * 45 + 15 : 0; // Simulated

    return {
      onTimePerformance,
      totalFlights,
      delays,
      averageDelay
    };
  }, [flights]);

  // Calculate route performance
  const routePerformance = React.useMemo(() => {
    const routes = new Map<string, { count: number; performance: number }>();
    
    flights.forEach(flight => {
      const routeKey = `${flight.departure_airport}-${flight.arrival_airport}`;
      const existing = routes.get(routeKey) || { count: 0, performance: 85 };
      routes.set(routeKey, {
        count: existing.count + 1,
        performance: Math.random() * 20 + 75 // Simulated performance
      });
    });
    
    return routes;
  }, [flights]);

  const handleAirportClick = (airport: Airport) => {
    setSelectedAirport(airport);
  };

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-white text-xl">Loading 3D Network Globe...</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-gradient-to-b from-black to-blue-900">
      <Canvas
        camera={{ position: [0, 0, 15], fov: 60 }}
        style={{ background: 'radial-gradient(circle, #0a0a0a 0%, #1a1a2e 100%)' }}
      >
        <Suspense fallback={null}>
          <ambientLight intensity={0.6} />
          <directionalLight position={[10, 10, 5]} intensity={1.2} castShadow />
          <pointLight position={[0, 0, 10]} intensity={0.8} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} />
          
          {/* Earth Globe */}
          <EarthGlobe />
          
          {/* Airport Nodes */}
          {airports.map(airport => (
            <AirportNode
              key={airport.icao}
              airport={airport}
              metrics={{
                onTimePerformance: 85 + Math.random() * 15,
                totalFlights: Math.floor(Math.random() * 20 + 5),
                delays: Math.floor(Math.random() * 5),
                averageDelay: Math.random() * 30 + 10
              }}
              onClick={handleAirportClick}
            />
          ))}
          
          {/* Flight Routes */}
          {showRoutes && airports.length > 1 && routePerformance.size > 0 && (
            Array.from(routePerformance.entries()).map(([routeKey, data]) => {
              const [depCode, arrCode] = routeKey.split('-');
              const depAirport = airports.find(a => a.icao === depCode);
              const arrAirport = airports.find(a => a.icao === arrCode);
              
              if (!depAirport || !arrAirport) return null;
              
              return (
                <FlightRoute
                  key={routeKey}
                  from={depAirport}
                  to={arrAirport}
                  flightCount={data.count}
                  performance={data.performance}
                />
              );
            })
          )}
          
          {/* Active Flights */}
          {showFlights && flights.map(flight => (
            <ActiveFlight
              key={flight.flight_number}
              flight={flight}
            />
          ))}
          
          <OrbitControls
            enableZoom={true}
            enablePan={true}
            enableRotate={true}
            minDistance={8}
            maxDistance={25}
            autoRotate={rotationSpeed > 0}
            autoRotateSpeed={rotationSpeed * 1000}
          />
        </Suspense>
      </Canvas>

      {/* UI Overlays */}
      <PerformanceHUD
        selectedAirport={selectedAirport}
        networkMetrics={networkMetrics}
      />
      
      <ControlPanel
        showRoutes={showRoutes}
        setShowRoutes={setShowRoutes}
        showFlights={showFlights}
        setShowFlights={setShowFlights}
        rotationSpeed={rotationSpeed}
        setRotationSpeed={setRotationSpeed}
      />
      
      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-black/80 backdrop-blur-sm rounded-lg p-4 text-white z-10">
        <h3 className="text-sm font-bold mb-2 text-blue-300">Performance Legend</h3>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            <span>Excellent (85%+)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span>Good (70-84%)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <span>Poor (&lt;70%)</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Network3DGlobe;