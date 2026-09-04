'use client';
// FILE: src/components/seeker/home/three/MeshGlobe.tsx
// The mesh itself: a wireframe icosphere with a point at every vertex and a
// smaller counter-spinning one inside it. Spins on its own, leans toward the
// pointer through a damped spring, and shrinks + drops back as the hero
// scrolls out so the page hands over to the content underneath it.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scenePointer } from './pointer-store';

const SPIN = 0.12;          // rad/s
const LEAN = 0.38;          // rad of tilt at the pointer's extremes
const SPRING = 3.2;         // spring stiffness (per second)
const DAMPING = 0.85;

export default function MeshGlobe() {
  const outerRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const lean = useRef({ x: 0, y: 0, vx: 0, vy: 0 });

  const outerGeometry = useMemo(() => new THREE.IcosahedronGeometry(1.55, 1), []);
  const innerGeometry = useMemo(() => new THREE.IcosahedronGeometry(0.82, 0), []);
  const outerEdges = useMemo(() => new THREE.EdgesGeometry(outerGeometry), [outerGeometry]);
  const innerEdges = useMemo(() => new THREE.EdgesGeometry(innerGeometry), [innerGeometry]);

  useFrame((_, delta) => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const dt = Math.min(delta, 0.05);

    const targetX = scenePointer.isActive ? -scenePointer.y * LEAN : 0;
    const targetY = scenePointer.isActive ? scenePointer.x * LEAN : 0;
    const l = lean.current;
    l.vx = (l.vx + (targetX - l.x) * SPRING * dt) * Math.pow(DAMPING, dt * 60);
    l.vy = (l.vy + (targetY - l.y) * SPRING * dt) * Math.pow(DAMPING, dt * 60);
    l.x += l.vx * dt * 60;
    l.y += l.vy * dt * 60;

    const scroll = scenePointer.scrollProgress;
    const scale = 1 - scroll * 0.45;
    outer.rotation.y += SPIN * dt;
    outer.rotation.x = l.x + Math.sin(performance.now() / 2600) * 0.06;
    outer.rotation.z = l.y * 0.35;
    outer.position.y = -scroll * 1.6;
    outer.scale.setScalar(scale);

    inner.rotation.y -= SPIN * 1.9 * dt;
    inner.rotation.x += SPIN * 0.7 * dt;
    inner.position.y = outer.position.y;
    inner.scale.setScalar(scale);
  });

  return (
    <>
      <group ref={outerRef}>
        <lineSegments geometry={outerEdges}>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.34} />
        </lineSegments>
        <points geometry={outerGeometry}>
          <pointsMaterial color="#ffffff" size={0.045} sizeAttenuation transparent opacity={0.95} />
        </points>
      </group>
      <group ref={innerRef}>
        <lineSegments geometry={innerEdges}>
          <lineBasicMaterial color="#ffffff" transparent opacity={0.16} />
        </lineSegments>
      </group>
    </>
  );
}
