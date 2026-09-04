'use client';
// FILE: src/components/seeker/home/three/CubeField.tsx
// The /find-work hero object: cubes all over the page on a pure ink ground.
// A large wireframe cube at the centre with a nested inner one, and a field
// of smaller cubes scattered through depth — half full wireframes, half only
// their eight corner points. Everything tumbles slowly, leans toward the
// pointer on a spring, and sinks as the hero scrolls out.
//
// PERFORMANCE: one useFrame for the whole field. Twenty pieces sharing one
// callback and two geometries costs a fraction of twenty subscribers, and
// this is the difference between 60fps and a stutter on an integrated GPU.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scenePointer } from './pointer-store';

const LEAN = 0.3;
const SPRING = 3.2;
const DAMPING = 0.86;

interface Scatter {
  x: number; y: number; z: number; size: number;
  spinX: number; spinY: number; phase: number; isDots: boolean; opacity: number;
}

/** Deterministic scatter so every visitor sees the same field. */
function buildScatter(count: number): Scatter[] {
  let seed = 7;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const scatter: Scatter[] = [];
  for (let index = 0; index < count; index += 1) {
    const angle = random() * Math.PI * 2;
    const radius = 2.4 + random() * 5.2;
    scatter.push({
      x: Math.cos(angle) * radius * 1.35, y: (random() - 0.5) * 5.2, z: -1.5 - random() * 6,
      size: 0.16 + random() * 0.34,
      spinX: (random() - 0.5) * 0.9, spinY: (random() - 0.5) * 0.9,
      phase: random() * Math.PI * 2, isDots: index % 2 === 1, opacity: 0.22 + random() * 0.4,
    });
  }
  return scatter;
}

export default function CubeField({ isLite }: { isLite: boolean }) {
  const outerRef = useRef<THREE.Group>(null);
  const innerRef = useRef<THREE.Group>(null);
  const pieceRefs = useRef<(THREE.Group | null)[]>([]);
  const lean = useRef({ x: 0, y: 0, vx: 0, vy: 0 });

  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), []);
  const corners = useMemo(() => {
    const positions = new Float32Array(24);
    let index = 0;
    for (const x of [-0.5, 0.5]) for (const y of [-0.5, 0.5]) for (const z of [-0.5, 0.5]) {
      positions[index++] = x; positions[index++] = y; positions[index++] = z;
    }
    return positions;
  }, []);
  const scatter = useMemo(() => buildScatter(isLite ? 12 : 20), [isLite]);

  useFrame((state, delta) => {
    const outer = outerRef.current;
    const inner = innerRef.current;
    if (!outer || !inner) return;
    const dt = Math.min(delta, 0.05);
    const time = state.clock.elapsedTime;

    const targetX = scenePointer.isActive ? -scenePointer.y * LEAN : 0;
    const targetY = scenePointer.isActive ? scenePointer.x * LEAN : 0;
    const l = lean.current;
    l.vx = (l.vx + (targetX - l.x) * SPRING * dt) * Math.pow(DAMPING, dt * 60);
    l.vy = (l.vy + (targetY - l.y) * SPRING * dt) * Math.pow(DAMPING, dt * 60);
    l.x += l.vx * dt * 60;
    l.y += l.vy * dt * 60;

    const drop = scenePointer.scrollProgress;
    const sink = -drop * 2.2;
    outer.rotation.x = l.x + Math.sin(time * 0.3) * 0.07;
    outer.rotation.y += 0.1 * dt;
    outer.rotation.z = l.y * 0.35;
    outer.position.y = sink;
    outer.scale.setScalar(2.3 * (1 - drop * 0.35));
    inner.rotation.x = -l.x * 0.5;
    inner.rotation.y -= 0.24 * dt;
    inner.position.y = sink;
    inner.scale.setScalar(1.15 * (1 - drop * 0.35));

    for (let index = 0; index < scatter.length; index += 1) {
      const group = pieceRefs.current[index];
      if (!group) continue;
      const item = scatter[index];
      const t = time + item.phase;
      group.rotation.set(t * item.spinX, t * item.spinY, 0);
      group.position.set(item.x, item.y + Math.sin(t * 0.6) * 0.12 + sink, item.z);
    }
  });

  return (
    <>
      <group ref={outerRef} position={[0, 0, -1.2]}>
        <lineSegments geometry={edges}><lineBasicMaterial color="#ffffff" transparent opacity={0.28} /></lineSegments>
        <points>
          <bufferGeometry><bufferAttribute attach="attributes-position" args={[corners, 3]} /></bufferGeometry>
          <pointsMaterial color="#ffffff" size={0.05} sizeAttenuation transparent opacity={0.9} />
        </points>
      </group>
      <group ref={innerRef} position={[0, 0, -1.2]}>
        <lineSegments geometry={edges}><lineBasicMaterial color="#ffffff" transparent opacity={0.14} /></lineSegments>
      </group>
      {scatter.map((item, index) => (
        <group key={item.phase} ref={element => { pieceRefs.current[index] = element; }} scale={item.size}>
          {item.isDots ? (
            <points>
              <bufferGeometry><bufferAttribute attach="attributes-position" args={[corners, 3]} /></bufferGeometry>
              <pointsMaterial color="#ffffff" size={0.05} sizeAttenuation transparent opacity={item.opacity + 0.3} />
            </points>
          ) : (
            <lineSegments geometry={edges}><lineBasicMaterial color="#ffffff" transparent opacity={item.opacity} /></lineSegments>
          )}
        </group>
      ))}
    </>
  );
}
