import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useKeyboardControls } from '@react-three/drei';
import * as THREE from 'three';
import { useFlightState } from '../lib/stores/useFlightState';

// Boeing 787 approximate dimensions (scaled for visibility)
const AIRCRAFT_SCALE = 0.1;
const FUSELAGE_LENGTH = 60 * AIRCRAFT_SCALE;
const WING_SPAN = 60 * AIRCRAFT_SCALE;
const TAIL_HEIGHT = 16 * AIRCRAFT_SCALE;

enum FlightControls {
  pitchUp = 'pitchUp',
  pitchDown = 'pitchDown',
  rollLeft = 'rollLeft',
  rollRight = 'rollRight',
  yawLeft = 'yawLeft',
  yawRight = 'yawRight',
  throttleUp = 'throttleUp',
  throttleDown = 'throttleDown',
  autopilot = 'autopilot',
  emergency = 'emergency'
}

export default function Aircraft() {
  const groupRef = useRef<THREE.Group>(null);
  const [subscribe, getKeys] = useKeyboardControls<FlightControls>();
  const { 
    position, 
    rotation, 
    velocity, 
    throttle, 
    updatePosition, 
    updateRotation, 
    updateThrottle,
    isAutopilot,
    toggleAutopilot 
  } = useFlightState();

  // Handle keyboard input and flight dynamics
  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const keys = getKeys();
    
    // Throttle control
    if (keys.throttleUp && throttle < 100) {
      updateThrottle(Math.min(100, throttle + 50 * delta));
    }
    if (keys.throttleDown && throttle > 0) {
      updateThrottle(Math.max(0, throttle - 50 * delta));
    }

    // Only allow manual control if autopilot is off
    if (!isAutopilot) {
      const pitchSpeed = 0.5 * delta;
      const rollSpeed = 0.8 * delta;
      const yawSpeed = 0.3 * delta;

      // Pitch control (elevator)
      if (keys.pitchUp) {
        updateRotation([
          Math.max(-Math.PI / 6, rotation[0] - pitchSpeed),
          rotation[1],
          rotation[2]
        ]);
      }
      if (keys.pitchDown) {
        updateRotation([
          Math.min(Math.PI / 6, rotation[0] + pitchSpeed),
          rotation[1],
          rotation[2]
        ]);
      }

      // Roll control (ailerons)
      if (keys.rollLeft) {
        updateRotation([
          rotation[0],
          rotation[1],
          Math.min(Math.PI / 4, rotation[2] + rollSpeed)
        ]);
      }
      if (keys.rollRight) {
        updateRotation([
          rotation[0],
          rotation[1],
          Math.max(-Math.PI / 4, rotation[2] - rollSpeed)
        ]);
      }

      // Yaw control (rudder)
      if (keys.yawLeft) {
        updateRotation([
          rotation[0],
          rotation[1] + yawSpeed,
          rotation[2]
        ]);
      }
      if (keys.yawRight) {
        updateRotation([
          rotation[0],
          rotation[1] - yawSpeed,
          rotation[2]
        ]);
      }
    }

    // Calculate velocity based on throttle and drag
    const thrust = (throttle / 100) * 30; // Max speed of 30 units
    const drag = velocity * velocity * 0.01; // Quadratic drag
    const netForce = thrust - drag;
    const newVelocity = Math.max(0, velocity + netForce * delta);
    
    // Update position based on velocity and rotation
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyEuler(new THREE.Euler(rotation[0], rotation[1], rotation[2]));
    
    const deltaPosition = direction.multiplyScalar(newVelocity * delta);
    updatePosition([
      position[0] + deltaPosition.x,
      position[1] + deltaPosition.y,
      position[2] + deltaPosition.z
    ]);

    // Apply transformations to the aircraft model
    groupRef.current.position.set(position[0], position[1], position[2]);
    groupRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);

    console.log(`Flight Status - Throttle: ${throttle.toFixed(1)}%, Velocity: ${newVelocity.toFixed(1)}, Autopilot: ${isAutopilot}`);
  });

  // Handle autopilot toggle
  useEffect(() => {
    return subscribe(
      (state) => state.autopilot,
      (pressed) => {
        if (pressed) {
          toggleAutopilot();
          console.log(`Autopilot ${isAutopilot ? 'Disengaged' : 'Engaged'}`);
        }
      }
    );
  }, [subscribe, toggleAutopilot, isAutopilot]);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Boeing 787 Fuselage */}
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[3, 2.5, FUSELAGE_LENGTH, 16]} />
        <meshStandardMaterial color="#E8E8E8" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Wings */}
      <group>
        {/* Main wing */}
        <mesh position={[0, 0, 5]} castShadow>
          <boxGeometry args={[WING_SPAN, 0.5, 8]} />
          <meshStandardMaterial color="#D0D0D0" metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Wing engines */}
        <mesh position={[-12, -2, 5]} castShadow>
          <cylinderGeometry args={[1.5, 1.5, 6, 16]} />
          <meshStandardMaterial color="#B0B0B0" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[12, -2, 5]} castShadow>
          <cylinderGeometry args={[1.5, 1.5, 6, 16]} />
          <meshStandardMaterial color="#B0B0B0" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Tail assembly */}
      <group position={[0, 0, FUSELAGE_LENGTH / 2 - 5]}>
        {/* Vertical stabilizer */}
        <mesh position={[0, 4, 0]} castShadow>
          <boxGeometry args={[0.5, TAIL_HEIGHT, 6]} />
          <meshStandardMaterial color="#D0D0D0" metalness={0.9} roughness={0.1} />
        </mesh>
        
        {/* Horizontal stabilizer */}
        <mesh position={[0, 2, 2]} castShadow>
          <boxGeometry args={[16, 0.5, 4]} />
          <meshStandardMaterial color="#D0D0D0" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>

      {/* Boeing 787 livery elements */}
      <group>
        {/* Cockpit windows */}
        <mesh position={[0, 1.5, -FUSELAGE_LENGTH / 2 + 3]}>
          <boxGeometry args={[4, 1.5, 2]} />
          <meshStandardMaterial color="#000080" transparent opacity={0.7} />
        </mesh>
        
        {/* Navigation lights */}
        <mesh position={[-WING_SPAN / 2, 0, 5]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshStandardMaterial color="#FF0000" emissive="#FF0000" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[WING_SPAN / 2, 0, 5]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshStandardMaterial color="#00FF00" emissive="#00FF00" emissiveIntensity={0.5} />
        </mesh>
        <mesh position={[0, 4, FUSELAGE_LENGTH / 2 - 2]}>
          <sphereGeometry args={[0.3, 8, 8]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFFFFF" emissiveIntensity={0.3} />
        </mesh>
      </group>

      {/* Engine exhaust effects */}
      {throttle > 20 && (
        <group>
          <mesh position={[-12, -2, 8]}>
            <coneGeometry args={[0.8, 3, 8]} />
            <meshStandardMaterial 
              color="#FFB84D" 
              transparent 
              opacity={throttle / 200}
              emissive="#FF6B00"
              emissiveIntensity={throttle / 200}
            />
          </mesh>
          <mesh position={[12, -2, 8]}>
            <coneGeometry args={[0.8, 3, 8]} />
            <meshStandardMaterial 
              color="#FFB84D" 
              transparent 
              opacity={throttle / 200}
              emissive="#FF6B00"
              emissiveIntensity={throttle / 200}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
