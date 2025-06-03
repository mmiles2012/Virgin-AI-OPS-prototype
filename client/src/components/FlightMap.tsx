import { useRef, useEffect, useState } from 'react';
import { useFrame, useLoader } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useFlightState } from '../lib/stores/useFlightState';
import { useScenario } from '../lib/stores/useScenario';

// Major airports with real coordinates
const MAJOR_AIRPORTS = [
  { code: 'LAX', name: 'Los Angeles International', lat: 33.9425, lon: -118.4081, x: -500, z: 200 },
  { code: 'JFK', name: 'John F. Kennedy International', lat: 40.6413, lon: -73.7781, x: 800, z: -100 },
  { code: 'ORD', name: 'Chicago O\'Hare International', lat: 41.9742, lon: -87.9073, x: 200, z: 0 },
  { code: 'DFW', name: 'Dallas/Fort Worth International', lat: 32.8998, lon: -97.0403, x: -100, z: 300 },
  { code: 'DEN', name: 'Denver International', lat: 39.8561, lon: -104.6737, x: -200, z: 100 },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International', lat: 33.6407, lon: -84.4277, x: 600, z: 200 },
  { code: 'SEA', name: 'Seattle-Tacoma International', lat: 47.4502, lon: -122.3088, x: -600, z: -200 },
  { code: 'LAS', name: 'McCarran International', lat: 36.0840, lon: -115.1537, x: -400, z: 250 },
  { code: 'PHX', name: 'Phoenix Sky Harbor International', lat: 33.4484, lon: -112.0740, x: -350, z: 280 },
  { code: 'MIA', name: 'Miami International', lat: 25.7959, lon: -80.2870, x: 750, z: 400 }
];

function SatelliteTerrain() {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    // Create a more realistic satellite-style texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Create realistic terrain base with varied colors
    const imageData = ctx.createImageData(512, 512);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % 512;
      const y = Math.floor((i / 4) / 512);
      
      // Generate varied terrain using noise-like patterns
      const noise1 = Math.sin(x * 0.02) * Math.cos(y * 0.02);
      const noise2 = Math.sin(x * 0.005) * Math.cos(y * 0.005);
      const combined = (noise1 + noise2) * 0.5;
      
      // Create different terrain types based on noise
      if (combined > 0.3) {
        // Mountains/hills - brown/gray
        data[i] = 101 + Math.random() * 30;     // R
        data[i + 1] = 67 + Math.random() * 20;  // G
        data[i + 2] = 33 + Math.random() * 15;  // B
      } else if (combined > 0.1) {
        // Forest/vegetation - green
        data[i] = 34 + Math.random() * 30;      // R
        data[i + 1] = 89 + Math.random() * 40;  // G
        data[i + 2] = 32 + Math.random() * 20;  // B
      } else if (combined > -0.1) {
        // Plains/farmland - light brown/yellow
        data[i] = 139 + Math.random() * 40;     // R
        data[i + 1] = 115 + Math.random() * 30; // G
        data[i + 2] = 85 + Math.random() * 25;  // B
      } else {
        // Water bodies - blue
        data[i] = 25 + Math.random() * 15;      // R
        data[i + 1] = 51 + Math.random() * 20;  // G
        data[i + 2] = 102 + Math.random() * 30; // B
      }
      data[i + 3] = 255; // Alpha
    }

    ctx.putImageData(imageData, 0, 0);

    // Add urban areas (darker patches)
    ctx.fillStyle = '#2a2a2a';
    for (let i = 0; i < 15; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const size = Math.random() * 20 + 5;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, Math.PI * 2);
      ctx.fill();
    }

    // Add road networks
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 1;
    for (let i = 0; i < 25; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 512, Math.random() * 512);
      ctx.lineTo(Math.random() * 512, Math.random() * 512);
      ctx.stroke();
    }

    // Add coastlines
    ctx.strokeStyle = '#1e40af';
    ctx.lineWidth = 2;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      ctx.moveTo(Math.random() * 512, Math.random() * 512);
      ctx.quadraticCurveTo(
        Math.random() * 512, Math.random() * 512,
        Math.random() * 512, Math.random() * 512
      );
      ctx.stroke();
    }

    const canvasTexture = new THREE.CanvasTexture(canvas);
    canvasTexture.wrapS = THREE.RepeatWrapping;
    canvasTexture.wrapT = THREE.RepeatWrapping;
    canvasTexture.repeat.set(3, 3);
    canvasTexture.needsUpdate = true;
    
    setTexture(canvasTexture);
  }, []);

  return (
    <mesh ref={meshRef} position={[0, -1, 0]} receiveShadow rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[2000, 2000]} />
      <meshStandardMaterial 
        map={texture}
        transparent={false}
        opacity={1.0}
      />
    </mesh>
  );
}

function AirportMarker({ airport, isDestination = false, isOrigin = false }: { 
  airport: typeof MAJOR_AIRPORTS[0], 
  isDestination?: boolean,
  isOrigin?: boolean 
}) {
  const meshRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 2) * 0.1;
    }
  });

  const color = isOrigin ? "#22c55e" : isDestination ? "#3b82f6" : "#f59e0b";
  const emissiveColor = isOrigin ? "#22c55e" : isDestination ? "#3b82f6" : "#f59e0b";

  return (
    <group ref={meshRef} position={[airport.x, 2, airport.z]}>
      {/* Airport runway representation */}
      <mesh position={[0, -1.5, 0]}>
        <boxGeometry args={[20, 0.5, 4]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      <mesh position={[0, -1.5, 8]}>
        <boxGeometry args={[20, 0.5, 4]} />
        <meshStandardMaterial color="#2a2a2a" />
      </mesh>
      
      {/* Airport beacon */}
      <mesh>
        <cylinderGeometry args={[5, 5, 3]} />
        <meshStandardMaterial color={color} emissive={emissiveColor} emissiveIntensity={0.4} />
      </mesh>
      
      {/* Airport code label */}
      <Text
        position={[0, 15, 0]}
        fontSize={8}
        color={color}
        anchorX="center"
        anchorY="middle"
      >
        {airport.code}
      </Text>
      
      {/* Airport name label */}
      <Text
        position={[0, 8, 0]}
        fontSize={4}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
      >
        {airport.name}
      </Text>
    </group>
  );
}

export default function FlightMap() {
  const { position } = useFlightState();
  const { nearestAirports } = useScenario();

  return (
    <group>
      {/* Satellite terrain background */}
      <SatelliteTerrain />
      
      {/* Major airports */}
      {MAJOR_AIRPORTS.map((airport) => (
        <AirportMarker
          key={airport.code}
          airport={airport}
          isOrigin={airport.code === 'LAX'}
          isDestination={airport.code === 'JFK'}
        />
      ))}

      {/* Flight path visualization */}
      <group position={[position[0] || 0, 0, position[2] || 0]}>
        {/* Flight path line */}
        <line>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([
                -500, 2, 200,  // LAX position
                800, 2, -100   // JFK position
              ])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#60a5fa" />
        </line>

        {/* Current aircraft position marker */}
        <mesh position={[0, 5, 0]}>
          <sphereGeometry args={[4]} />
          <meshStandardMaterial 
            color="#fbbf24" 
            emissive="#fbbf24" 
            emissiveIntensity={0.6}
          />
        </mesh>
        
        {/* Aircraft trail */}
        <Text
          position={[0, 12, 0]}
          fontSize={6}
          color="#fbbf24"
          anchorX="center"
          anchorY="middle"
        >
          B787
        </Text>

        {/* Nearest airports for emergency diversion */}
        {nearestAirports.map((airport, index) => {
          const angle = (index * Math.PI * 2) / nearestAirports.length;
          const distance = 120 + airport.distance * 0.3;
          const x = Math.cos(angle) * distance;
          const z = Math.sin(angle) * distance;
          
          return (
            <group key={airport.icao} position={[x, 2, z]}>
              <mesh>
                <cylinderGeometry args={[3, 3, 1]} />
                <meshStandardMaterial 
                  color={airport.medicalFacilities ? "#ef4444" : "#f59e0b"}
                  emissive={airport.medicalFacilities ? "#ef4444" : "#f59e0b"}
                  emissiveIntensity={0.4}
                />
              </mesh>
              
              <Text
                position={[0, 10, 0]}
                fontSize={4}
                color={airport.medicalFacilities ? "#ef4444" : "#f59e0b"}
                anchorX="center"
                anchorY="middle"
              >
                {airport.icao}
              </Text>
              
              <Text
                position={[0, 6, 0]}
                fontSize={2}
                color="#94a3b8"
                anchorX="center"
                anchorY="middle"
              >
                {airport.distance.toFixed(0)} nm
              </Text>

              {/* Distance line to aircraft */}
              <line>
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={2}
                    array={new Float32Array([
                      0, 2, 0,    // Airport position
                      -x, 2, -z   // Aircraft position (inverted)
                    ])}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial 
                  color={airport.medicalFacilities ? "#ef4444" : "#f59e0b"}
                  transparent
                  opacity={0.3}
                  linewidth={1}
                />
              </line>
            </group>
          );
        })}

        {/* Navigation waypoints */}
        {[
          { name: "BAVPA", pos: [-300, 2, 100] as [number, number, number] },
          { name: "HITME", pos: [-100, 2, 50] as [number, number, number] },
          { name: "DOSXX", pos: [200, 2, -20] as [number, number, number] },
          { name: "ROBUC", pos: [500, 2, -60] as [number, number, number] }
        ].map((waypoint) => (
          <group key={waypoint.name} position={waypoint.pos}>
            <mesh>
              <boxGeometry args={[2, 2, 2]} />
              <meshStandardMaterial color="#a855f7" transparent opacity={0.7} />
            </mesh>
            <Text
              position={[0, 8, 0]}
              fontSize={3}
              color="#a855f7"
              anchorX="center"
              anchorY="middle"
            >
              {waypoint.name}
            </Text>
          </group>
        ))}

        {/* Weather systems (simplified) */}
        <group position={[300, 20, -50]}>
          <mesh>
            <sphereGeometry args={[25, 16, 16]} />
            <meshStandardMaterial 
              color="#6b7280" 
              transparent 
              opacity={0.3}
              emissive="#6b7280"
              emissiveIntensity={0.1}
            />
          </mesh>
          <Text
            position={[0, 30, 0]}
            fontSize={6}
            color="#6b7280"
            anchorX="center"
            anchorY="middle"
          >
            WEATHER
          </Text>
        </group>
      </group>


    </group>
  );
}
