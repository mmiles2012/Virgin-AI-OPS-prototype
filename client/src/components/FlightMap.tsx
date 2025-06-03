import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useFlightState } from '../lib/stores/useFlightState';
import { useScenario } from '../lib/stores/useScenario';

export default function FlightMap() {
  const groundRef = useRef<THREE.Mesh>(null);
  const { position } = useFlightState();
  const { nearestAirports } = useScenario();

  return (
    <group>
      {/* Ground/Ocean representation */}
      <mesh ref={groundRef} position={[0, -1, 0]} receiveShadow>
        <planeGeometry args={[2000, 2000]} />
        <meshStandardMaterial color="#1e3a8a" transparent opacity={0.3} />
      </mesh>

      {/* Flight path visualization */}
      <group position={[position[0], 0, position[2]]}>
        {/* Origin marker (LAX) */}
        <group position={[-500, 2, 200]}>
          <mesh>
            <cylinderGeometry args={[5, 5, 2]} />
            <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.3} />
          </mesh>
          <Text
            position={[0, 15, 0]}
            fontSize={8}
            color="#22c55e"
            anchorX="center"
            anchorY="middle"
          >
            LAX
          </Text>
        </group>

        {/* Destination marker (JFK) */}
        <group position={[800, 2, -100]}>
          <mesh>
            <cylinderGeometry args={[5, 5, 2]} />
            <meshStandardMaterial color="#3b82f6" emissive="#3b82f6" emissiveIntensity={0.3} />
          </mesh>
          <Text
            position={[0, 15, 0]}
            fontSize={8}
            color="#3b82f6"
            anchorX="center"
            anchorY="middle"
          >
            JFK
          </Text>
        </group>

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
          <lineBasicMaterial color="#60a5fa" linewidth={2} />
        </line>

        {/* Current aircraft position marker */}
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[3]} />
          <meshStandardMaterial 
            color="#fbbf24" 
            emissive="#fbbf24" 
            emissiveIntensity={0.5}
          />
        </mesh>

        {/* Nearest airports for emergency diversion */}
        {nearestAirports.map((airport, index) => {
          // Position airports in a realistic spread around the flight path
          const angle = (index * Math.PI * 2) / nearestAirports.length;
          const distance = 100 + airport.distance * 0.5; // Scale distance for visibility
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
          { name: "BAVPA", pos: [-300, 2, 100] },
          { name: "HITME", pos: [-100, 2, 50] },
          { name: "DOSXX", pos: [200, 2, -20] },
          { name: "ROBUC", pos: [500, 2, -60] }
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

      {/* Grid reference */}
      <gridHelper args={[1000, 50, "#1e3a8a", "#1e3a8a"]} position={[0, -1, 0]} />
    </group>
  );
}
