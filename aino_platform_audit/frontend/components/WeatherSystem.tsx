import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function WeatherSystem() {
  const cloudsRef = useRef<THREE.Group>(null);
  const rainRef = useRef<THREE.Points>(null);

  // Generate cloud particles
  const cloudParticles = useMemo(() => {
    const particles = new Float32Array(500 * 3);
    for (let i = 0; i < 500; i++) {
      particles[i * 3] = (Math.random() - 0.5) * 800;     // x
      particles[i * 3 + 1] = Math.random() * 50 + 30;     // y
      particles[i * 3 + 2] = (Math.random() - 0.5) * 800; // z
    }
    return particles;
  }, []);

  // Generate rain particles
  const rainParticles = useMemo(() => {
    const particles = new Float32Array(1000 * 3);
    for (let i = 0; i < 1000; i++) {
      particles[i * 3] = (Math.random() - 0.5) * 400;     // x
      particles[i * 3 + 1] = Math.random() * 100 + 50;    // y
      particles[i * 3 + 2] = (Math.random() - 0.5) * 400; // z
    }
    return particles;
  }, []);

  // Animate weather effects
  useFrame((state, delta) => {
    if (cloudsRef.current) {
      cloudsRef.current.rotation.y += delta * 0.1;
    }

    if (rainRef.current) {
      const positions = rainRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 1; i < positions.length; i += 3) {
        positions[i] -= delta * 50; // Rain falling speed
        if (positions[i] < 0) {
          positions[i] = 100; // Reset to top
        }
      }
      rainRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <group>
      {/* Cloud System */}
      <group ref={cloudsRef} position={[300, 40, -50]}>
        <points>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={cloudParticles.length / 3}
              array={cloudParticles}
              itemSize={3}
            />
          </bufferGeometry>
          <pointsMaterial
            color="#e5e7eb"
            size={8}
            transparent
            opacity={0.6}
            fog={false}
          />
        </points>

        {/* Main cloud mass */}
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[60, 16, 16]} />
          <meshStandardMaterial
            color="#9ca3af"
            transparent
            opacity={0.3}
            fog={false}
          />
        </mesh>
      </group>

      {/* Rain System (conditional) */}
      <points ref={rainRef} position={[300, 0, -50]}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={rainParticles.length / 3}
            array={rainParticles}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          color="#7dd3fc"
          size={1}
          transparent
          opacity={0.6}
        />
      </points>

      {/* Wind indicators */}
      <group position={[100, 20, 100]}>
        {Array.from({ length: 10 }).map((_, i) => (
          <mesh key={i} position={[i * 20, Math.sin(i) * 5, 0]}>
            <cylinderGeometry args={[0.5, 0.5, 15]} />
            <meshStandardMaterial color="#60a5fa" transparent opacity={0.4} />
          </mesh>
        ))}
      </group>

      {/* Turbulence zones */}
      <mesh position={[-200, 35, 150]}>
        <boxGeometry args={[80, 30, 80]} />
        <meshStandardMaterial
          color="#f59e0b"
          transparent
          opacity={0.2}
          wireframe
        />
      </mesh>

      {/* Temperature gradient visualization */}
      <mesh position={[0, 25, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial
          color="#1e3a8a"
          transparent
          opacity={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
}
