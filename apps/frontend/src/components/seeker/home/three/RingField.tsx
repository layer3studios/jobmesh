'use client';
// FILE: src/components/seeker/home/three/RingField.tsx
// The /directory signature object — five concentric wireframe rings on
// different tilts, each turning at its own rate, with a point riding each one.
// A company is an orbit: many of them, all around the same centre, none of
// them the same. Same white-hairline vocabulary as the globe and the cube, so
// the three pages read as one product.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scenePointer } from './pointer-store';

const LEAN = 0.36;
const SPRING = 3.0;
const DAMPING = 0.87;
const SEGMENTS = 96;

interface Ring { radius: number; tiltX: number; tiltZ: number; speed: number; opacity: number }

const RINGS: Ring[] = [
  { radius: 1.1, tiltX: 0.5, tiltZ: 0.1, speed: 0.30, opacity: 0.5 },
  { radius: 1.7, tiltX: -0.35, tiltZ: 0.4, speed: -0.22, opacity: 0.42 },
  { radius: 2.3, tiltX: 0.75, tiltZ: -0.2, speed: 0.16, opacity: 0.34 },
  { radius: 2.9, tiltX: -0.2, tiltZ: 0.6, speed: -0.12, opacity: 0.26 },
  { radius: 3.5, tiltX: 0.3, tiltZ: -0.45, speed: 0.09, opacity: 0.18 },
];

/** A closed circle in the XY plane, tilted by the group that holds it. */
function useCircle() {
  return useMemo(() => {
    const positions = new Float32Array((SEGMENTS + 1) * 3);
    for (let index = 0; index <= SEGMENTS; index += 1) {
      const angle = (index / SEGMENTS) * Math.PI * 2;
      positions[index * 3] = Math.cos(angle);
      positions[index * 3 + 1] = Math.sin(angle);
    }
    return positions;
  }, []);
}

function Orbit({ ring, circle }: { ring: Ring; circle: Float32Array }) {
  const groupRef = useRef<THREE.Group>(null);
  const beadRef = useRef<THREE.Points>(null);
  const clock = useRef(ring.radius * 2);

  useFrame((_, delta) => {
    const group = groupRef.current;
    const bead = beadRef.current;
    if (!group || !bead) return;
    clock.current += Math.min(delta, 0.05);
    group.rotation.z += ring.speed * delta;
    const angle = clock.current * ring.speed * 3;
    bead.position.set(Math.cos(angle) * ring.radius, Math.sin(angle) * ring.radius, 0);
  });

  return (
    <group ref={groupRef} rotation={[ring.tiltX, 0, ring.tiltZ]} scale={ring.radius}>
      <line>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[circle, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#ffffff" transparent opacity={ring.opacity} />
      </line>
      {/* The bead rides the ring in the group's own (unscaled) space. */}
      <points ref={beadRef} scale={1 / ring.radius}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[new Float32Array([0, 0, 0]), 3]} />
        </bufferGeometry>
        <pointsMaterial color="#ffffff" size={0.07} sizeAttenuation transparent opacity={0.9} />
      </points>
    </group>
  );
}

export default function RingField() {
  const circle = useCircle();
  const shellRef = useRef<THREE.Group>(null);
  const lean = useRef({ x: 0, y: 0, vx: 0, vy: 0 });

  useFrame((_, delta) => {
    const shell = shellRef.current;
    if (!shell) return;
    const dt = Math.min(delta, 0.05);
    const targetX = scenePointer.isActive ? -scenePointer.y * LEAN : 0;
    const targetY = scenePointer.isActive ? scenePointer.x * LEAN : 0;
    const l = lean.current;
    l.vx = (l.vx + (targetX - l.x) * SPRING * dt) * Math.pow(DAMPING, dt * 60);
    l.vy = (l.vy + (targetY - l.y) * SPRING * dt) * Math.pow(DAMPING, dt * 60);
    l.x += l.vx * dt * 60;
    l.y += l.vy * dt * 60;

    const drop = scenePointer.scrollProgress;
    shell.rotation.x = l.x;
    shell.rotation.y = l.y;
    shell.position.y = -drop * 1.8;
    shell.scale.setScalar(1 - drop * 0.35);
  });

  return (
    <group ref={shellRef}>
      {RINGS.map(ring => <Orbit key={ring.radius} ring={ring} circle={circle} />)}
    </group>
  );
}
