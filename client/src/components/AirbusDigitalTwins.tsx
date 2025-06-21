import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Environment, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';

// Aircraft specifications database for ML integration
export const AIRBUS_FLEET_SPECS = {
  'A320': {
    wingspan: 34.1,
    length: 37.57,
    height: 11.76,
    mtow: 78000,
    range: 6150,
    passengers: { typical: 180, max: 240 },
    engines: 'CFM56-5B / V2500',
    runway_requirements: {
      takeoff: 2090,
      landing: 1440
    },
    gate_requirements: {
      wingspan_clearance: 36,
      length_clearance: 40,
      height_clearance: 12.5,
      bridge_compatibility: 'standard'
    },
    fuel_capacity: 24210,
    service_ceiling: 39800
  },
  'A321': {
    wingspan: 34.1,
    length: 44.51,
    height: 11.76,
    mtow: 93500,
    range: 7400,
    passengers: { typical: 220, max: 244 },
    engines: 'CFM56-5B / V2500',
    runway_requirements: {
      takeoff: 2560,
      landing: 1500
    },
    gate_requirements: {
      wingspan_clearance: 36,
      length_clearance: 47,
      height_clearance: 12.5,
      bridge_compatibility: 'standard'
    },
    fuel_capacity: 32940,
    service_ceiling: 39800
  },
  'A330-200': {
    wingspan: 60.3,
    length: 58.8,
    height: 16.9,
    mtow: 238000,
    range: 13450,
    passengers: { typical: 293, max: 406 },
    engines: 'Trent 700 / CF6-80E1',
    runway_requirements: {
      takeoff: 2770,
      landing: 1800
    },
    gate_requirements: {
      wingspan_clearance: 65,
      length_clearance: 62,
      height_clearance: 18,
      bridge_compatibility: 'wide_body'
    },
    fuel_capacity: 139090,
    service_ceiling: 41000
  },
  'A330-300': {
    wingspan: 60.3,
    length: 63.7,
    height: 16.9,
    mtow: 242000,
    range: 11750,
    passengers: { typical: 335, max: 440 },
    engines: 'Trent 700 / CF6-80E1',
    runway_requirements: {
      takeoff: 2770,
      landing: 1800
    },
    gate_requirements: {
      wingspan_clearance: 65,
      length_clearance: 67,
      height_clearance: 18,
      bridge_compatibility: 'wide_body'
    },
    fuel_capacity: 139090,
    service_ceiling: 41000
  },
  'A350-1000': {
    wingspan: 64.75,
    length: 73.78,
    height: 17.05,
    mtow: 319000,
    range: 16100,
    passengers: { typical: 366, max: 480 },
    engines: 'Trent XWB-97',
    runway_requirements: {
      takeoff: 2750,
      landing: 1650
    },
    gate_requirements: {
      wingspan_clearance: 68,
      length_clearance: 76,
      height_clearance: 18.5,
      bridge_compatibility: 'wide_body'
    },
    fuel_capacity: 156000,
    service_ceiling: 43100
  },
  'A380': {
    wingspan: 79.75,
    length: 72.7,
    height: 24.1,
    mtow: 575000,
    range: 14800,
    passengers: { typical: 525, max: 853 },
    engines: 'Trent 900 / GP7200',
    runway_requirements: {
      takeoff: 2900,
      landing: 2000
    },
    gate_requirements: {
      wingspan_clearance: 85,
      length_clearance: 76,
      height_clearance: 26,
      bridge_compatibility: 'double_deck'
    },
    fuel_capacity: 320000,
    service_ceiling: 43000
  }
};

// Digital twin component for each Airbus aircraft type
function AirbusAircraftModel({ 
  aircraftType, 
  scale = 0.1, 
  showSpecs = false 
}: { 
  aircraftType: keyof typeof AIRBUS_FLEET_SPECS;
  scale?: number;
  showSpecs?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const specs = AIRBUS_FLEET_SPECS[aircraftType];

  useEffect(() => {
    if (!groupRef.current) return;

    // Clear previous aircraft
    groupRef.current.clear();

    // Create procedural aircraft based on real specifications
    const aircraft = new THREE.Group();

    // Fuselage proportions based on actual aircraft
    const fuselageLength = specs.length * 0.1;
    const fuselageRadius = aircraftType.includes('A380') ? 3.0 : 
                          aircraftType.includes('A350') || aircraftType.includes('A330') ? 2.0 : 1.5;

    const fuselage = new THREE.CylinderGeometry(fuselageRadius, fuselageRadius * 0.8, fuselageLength, 32);
    const fuselageMesh = new THREE.Mesh(
      fuselage,
      new THREE.MeshStandardMaterial({ color: '#E8E8E8' })
    );
    fuselageMesh.rotation.z = Math.PI / 2;

    // Wings based on wingspan specifications
    const wingSpan = specs.wingspan * 0.1;
    const wingChord = fuselageLength * 0.25;
    const wingGeometry = new THREE.BoxGeometry(wingSpan, 0.3, wingChord);
    const wingMesh = new THREE.Mesh(
      wingGeometry,
      new THREE.MeshStandardMaterial({ color: '#D0D0D0' })
    );

    // Engines based on aircraft type
    const engineCount = aircraftType.includes('A380') ? 4 : 2;
    const engineRadius = aircraftType.includes('A380') || aircraftType.includes('A350') || aircraftType.includes('A330') ? 1.0 : 0.7;
    const engineLength = fuselageLength * 0.2;

    for (let i = 0; i < engineCount; i++) {
      const engine = new THREE.CylinderGeometry(engineRadius, engineRadius * 1.1, engineLength, 16);
      const engineMesh = new THREE.Mesh(
        engine,
        new THREE.MeshStandardMaterial({ color: '#505050' })
      );
      engineMesh.rotation.z = Math.PI / 2;
      
      if (engineCount === 2) {
        engineMesh.position.set(-engineLength * 0.3, (i === 0 ? -1 : 1) * wingSpan * 0.3, -0.5);
      } else {
        // A380 engine positioning
        const yPos = (i < 2 ? -1 : 1) * wingSpan * (i % 2 === 0 ? 0.2 : 0.4);
        engineMesh.position.set(-engineLength * 0.3, yPos, -0.5);
      }
      
      aircraft.add(engineMesh);
    }

    // Tail
    const tailHeight = specs.height * 0.05;
    const tailGeometry = new THREE.BoxGeometry(1, tailHeight, 0.3);
    const tailMesh = new THREE.Mesh(
      tailGeometry,
      new THREE.MeshStandardMaterial({ color: '#C0C0C0' })
    );
    tailMesh.position.set(-fuselageLength * 0.4, 0, tailHeight * 0.3);

    aircraft.add(fuselageMesh, wingMesh, tailMesh);
    groupRef.current.add(aircraft);
  }, [aircraftType, specs]);

  useFrame((state) => {
    if (groupRef.current) {
      const time = state.clock.getElapsedTime();
      groupRef.current.rotation.y = time * 0.2;
    }
  });

  return (
    <group ref={groupRef} scale={[scale, scale, scale]} />
  );
}

// Airport compatibility assessment
export function assessAirportCompatibility(
  aircraftType: keyof typeof AIRBUS_FLEET_SPECS,
  airportSpecs: {
    longestRunway: number;
    wideBodyGates: number;
    doubleAisleCapable: boolean;
    maxWingspan: number;
    maxLength: number;
    maxHeight: number;
  }
): {
  compatible: boolean;
  issues: string[];
  score: number;
} {
  const aircraft = AIRBUS_FLEET_SPECS[aircraftType];
  const issues: string[] = [];
  let score = 100;

  // Runway compatibility
  if (airportSpecs.longestRunway < aircraft.runway_requirements.takeoff) {
    issues.push(`Runway too short: ${airportSpecs.longestRunway}m < ${aircraft.runway_requirements.takeoff}m required`);
    score -= 40;
  }

  // Gate compatibility
  if (aircraft.gate_requirements.bridge_compatibility === 'wide_body' && !airportSpecs.wideBodyGates) {
    issues.push('No wide-body gates available');
    score -= 30;
  }

  if (aircraft.gate_requirements.bridge_compatibility === 'double_deck' && !airportSpecs.doubleAisleCapable) {
    issues.push('No A380-capable gates available');
    score -= 50;
  }

  // Physical clearances
  if (airportSpecs.maxWingspan && airportSpecs.maxWingspan < aircraft.wingspan) {
    issues.push(`Wingspan clearance insufficient: ${aircraft.wingspan}m wingspan`);
    score -= 25;
  }

  if (airportSpecs.maxLength && airportSpecs.maxLength < aircraft.length) {
    issues.push(`Aircraft length clearance insufficient: ${aircraft.length}m length`);
    score -= 20;
  }

  if (airportSpecs.maxHeight && airportSpecs.maxHeight < aircraft.height) {
    issues.push(`Height clearance insufficient: ${aircraft.height}m height`);
    score -= 15;
  }

  return {
    compatible: issues.length === 0,
    issues,
    score: Math.max(0, score)
  };
}

// ML integration for fleet optimization
export function calculateFleetOptimization(
  route: {
    origin: string;
    destination: string;
    distance: number;
    demand: number;
    frequency: string;
  },
  availableAircraft: (keyof typeof AIRBUS_FLEET_SPECS)[]
): {
  recommended: keyof typeof AIRBUS_FLEET_SPECS;
  efficiency: number;
  reasoning: string[];
} {
  const recommendations = availableAircraft.map(aircraftType => {
    const specs = AIRBUS_FLEET_SPECS[aircraftType];
    let score = 0;
    const reasoning: string[] = [];

    // Range efficiency
    if (specs.range >= route.distance * 1.2) {
      score += 30;
      reasoning.push('Excellent range capability');
    } else if (specs.range >= route.distance) {
      score += 20;
      reasoning.push('Adequate range capability');
    } else {
      score -= 50;
      reasoning.push('Insufficient range');
    }

    // Passenger capacity vs demand
    const demandRatio = route.demand / specs.passengers.typical;
    if (demandRatio >= 0.8 && demandRatio <= 1.1) {
      score += 25;
      reasoning.push('Optimal passenger capacity utilization');
    } else if (demandRatio >= 0.6) {
      score += 15;
      reasoning.push('Good passenger capacity utilization');
    } else {
      score -= 20;
      reasoning.push('Suboptimal capacity utilization');
    }

    // Fuel efficiency (proxy based on aircraft generation)
    if (aircraftType.includes('A350')) {
      score += 20;
      reasoning.push('Latest generation fuel efficiency');
    } else if (aircraftType.includes('A330')) {
      score += 10;
      reasoning.push('Modern fuel efficiency');
    }

    return {
      aircraftType,
      score,
      reasoning
    };
  });

  const best = recommendations.reduce((prev, current) => 
    prev.score > current.score ? prev : current
  );

  return {
    recommended: best.aircraftType,
    efficiency: best.score,
    reasoning: best.reasoning
  };
}

// Diversion airport assessment
export function assessDiversionAirports(
  currentAircraft: keyof typeof AIRBUS_FLEET_SPECS,
  currentPosition: { lat: number; lon: number },
  alternateAirports: Array<{
    icao: string;
    name: string;
    lat: number;
    lon: number;
    runwayLength: number;
    wideBodyCapable: boolean;
    a380Capable?: boolean;
    fuelAvailable: boolean;
    maintenanceCapable: boolean;
  }>
): Array<{
  airport: any;
  compatibility: ReturnType<typeof assessAirportCompatibility>;
  distance: number;
  suitability: number;
}> {
  return alternateAirports.map(airport => {
    // Calculate distance
    const distance = calculateDistance(
      currentPosition.lat, currentPosition.lon,
      airport.lat, airport.lon
    );

    // Assess compatibility
    const compatibility = assessAirportCompatibility(currentAircraft, {
      longestRunway: airport.runwayLength,
      wideBodyGates: airport.wideBodyCapable ? 5 : 0,
      doubleAisleCapable: airport.a380Capable || false,
      maxWingspan: 80,
      maxLength: 80,
      maxHeight: 30
    });

    // Calculate overall suitability
    let suitability = compatibility.score;
    
    // Distance penalty
    if (distance > 500) suitability -= 20;
    else if (distance > 200) suitability -= 10;

    // Service capabilities
    if (airport.fuelAvailable) suitability += 15;
    if (airport.maintenanceCapable) suitability += 10;

    return {
      airport,
      compatibility,
      distance,
      suitability: Math.max(0, suitability)
    };
  }).sort((a, b) => b.suitability - a.suitability);
}

// Utility function for distance calculation
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Export component for visual representation in decision engines
export default function AirbusFleetVisualization({ 
  selectedAircraft = 'A350-1000',
  showAllTypes = false 
}: {
  selectedAircraft?: keyof typeof AIRBUS_FLEET_SPECS;
  showAllTypes?: boolean;
}) {
  const [currentAircraft, setCurrentAircraft] = useState(selectedAircraft);

  if (showAllTypes) {
    return (
      <div className="grid grid-cols-3 gap-4 h-64">
        {Object.keys(AIRBUS_FLEET_SPECS).map((aircraftType) => (
          <div key={aircraftType} className="bg-gradient-to-b from-blue-200 to-blue-400 rounded">
            <Canvas>
              <PerspectiveCamera makeDefault position={[5, 5, 5]} />
              <OrbitControls enableZoom={false} enablePan={false} />
              <ambientLight intensity={0.6} />
              <directionalLight position={[10, 10, 5]} intensity={1} />
              <AirbusAircraftModel 
                aircraftType={aircraftType as keyof typeof AIRBUS_FLEET_SPECS}
                scale={0.15}
              />
              <Environment preset="sunset" />
            </Canvas>
            <div className="text-center text-xs font-medium p-1">
              {aircraftType}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="h-64 bg-gradient-to-b from-blue-200 to-blue-400 rounded">
      <Canvas>
        <PerspectiveCamera makeDefault position={[8, 5, 8]} />
        <OrbitControls />
        <ambientLight intensity={0.6} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <AirbusAircraftModel aircraftType={currentAircraft} scale={0.2} />
        <Environment preset="sunset" />
      </Canvas>
    </div>
  );
}