import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';

const FloatingSphere = ({ position, color, size = 1, speed = 1, distort = 0.3 }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * speed * 0.2;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * speed * 0.3;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={0.3} floatIntensity={0.5}>
      <mesh ref={meshRef} position={position}>
        <sphereGeometry args={[size, 32, 32]} />
        <MeshDistortMaterial
          color={color}
          distort={distort}
          speed={speed * 2}
          roughness={0.2}
          metalness={0.8}
          emissive={color}
          emissiveIntensity={0.15}
        />
      </mesh>
    </Float>
  );
};

const FloatingRing = ({ position, color, speed = 1 }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * speed * 0.3;
      meshRef.current.rotation.z = state.clock.getElapsedTime() * speed * 0.4;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={0.4} floatIntensity={0.6}>
      <mesh ref={meshRef} position={position}>
        <torusGeometry args={[1.2, 0.15, 16, 64]} />
        <meshStandardMaterial
          color={color}
          metalness={0.9}
          roughness={0.1}
          emissive={color}
          emissiveIntensity={0.3}
        />
      </mesh>
    </Float>
  );
};

const FloatingIcosahedron = ({ position, color, speed = 1 }) => {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = state.clock.getElapsedTime() * speed * 0.25;
      meshRef.current.rotation.y = state.clock.getElapsedTime() * speed * 0.35;
    }
  });

  return (
    <Float speed={speed} rotationIntensity={0.5} floatIntensity={0.7}>
      <mesh ref={meshRef} position={position}>
        <icosahedronGeometry args={[0.7, 0]} />
        <MeshDistortMaterial
          color={color}
          distort={0.25}
          speed={speed}
          roughness={0.15}
          metalness={0.85}
        />
      </mesh>
    </Float>
  );
};

const Hero3D = () => {
  return (
    <div className="absolute inset-0 -z-10 opacity-50">
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ alpha: true, antialias: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={0.8} color="#a855f7" />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#6366f1" />
        <pointLight position={[0, 5, 5]} intensity={0.3} color="#c084fc" />

        {/* Main central sphere */}
        <FloatingSphere
          position={[0, 0, -2]}
          color="#a855f7"
          size={1.5}
          speed={0.5}
          distort={0.4}
        />

        {/* Surrounding elements */}
        <FloatingRing position={[-3, 1.5, -1]} color="#6366f1" speed={0.7} />
        <FloatingRing position={[3, -1, -1.5]} color="#c084fc" speed={0.6} />

        <FloatingIcosahedron position={[-2.5, -1.5, 0]} color="#8b5cf6" speed={0.8} />
        <FloatingIcosahedron position={[2.5, 2, 0]} color="#a855f7" speed={0.9} />

        {/* Smaller accent spheres */}
        <FloatingSphere
          position={[-4, 0, -1]}
          color="#c084fc"
          size={0.5}
          speed={1.2}
          distort={0.2}
        />
        <FloatingSphere
          position={[4, 1, -2]}
          color="#6366f1"
          size={0.6}
          speed={1}
          distort={0.25}
        />
        <FloatingSphere
          position={[1, -2.5, 0]}
          color="#8b5cf6"
          size={0.4}
          speed={1.3}
          distort={0.15}
        />
      </Canvas>
    </div>
  );
};

export default Hero3D;
