'use client';
// FILE: src/components/seeker/home/three/Lattice.tsx
// The /hire signature object: a 6×4×3 lattice of nodes joined to their
// neighbours — a ranked table, a pipeline, a structure — turning slowly and
// leaning toward the pointer. Deliberately the quietest object of the four:
// the hire hero already carries a product panel, so this sits behind the
// whole band at low opacity instead of competing with it.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scenePointer } from './pointer-store';

const COLUMNS = 6;
const ROWS = 4;
const LAYERS = 3;
const GAP = 1.15;
const LEAN = 0.22;
const SPRING = 2.8;
const DAMPING = 0.88;

function buildLattice() {
  const nodes: number[] = [];
  const links: number[] = [];
  const at = (c: number, r: number, l: number) => [
    (c - (COLUMNS - 1) / 2) * GAP, (r - (ROWS - 1) / 2) * GAP, (l - (LAYERS - 1) / 2) * GAP,
  ];
  for (let l = 0; l < LAYERS; l += 1) for (let r = 0; r < ROWS; r += 1) for (let c = 0; c < COLUMNS; c += 1) {
    const here = at(c, r, l);
    nodes.push(...here);
    if (c + 1 < COLUMNS) links.push(...here, ...at(c + 1, r, l));
    if (r + 1 < ROWS) links.push(...here, ...at(c, r + 1, l));
    if (l + 1 < LAYERS) links.push(...here, ...at(c, r, l + 1));
  }
  return { nodes: new Float32Array(nodes), links: new Float32Array(links) };
}

export default function Lattice() {
  const ref = useRef<THREE.Group>(null);
  const lean = useRef({ x: 0, y: 0, vx: 0, vy: 0 });
  const { nodes, links } = useMemo(buildLattice, []);

  useFrame((_, delta) => {
    const group = ref.current;
    if (!group) return;
    const dt = Math.min(delta, 0.05);
    const targetX = scenePointer.isActive ? -scenePointer.y * LEAN : 0;
    const targetY = scenePointer.isActive ? scenePointer.x * LEAN : 0;
    const l = lean.current;
    l.vx = (l.vx + (targetX - l.x) * SPRING * dt) * Math.pow(DAMPING, dt * 60);
    l.vy = (l.vy + (targetY - l.y) * SPRING * dt) * Math.pow(DAMPING, dt * 60);
    l.x += l.vx * dt * 60;
    l.y += l.vy * dt * 60;

    const drop = scenePointer.scrollProgress;
    group.rotation.x = 0.42 + l.x;
    group.rotation.y += 0.06 * dt;
    group.rotation.z = -0.18 + l.y * 0.5;
    group.position.y = -0.4 - drop * 1.6;
    group.scale.setScalar(1 - drop * 0.3);
  });

  return (
    <group ref={ref} rotation={[0.42, 0.6, -0.18]}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[links, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.12} />
      </lineSegments>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[nodes, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#ffffff" size={0.05} sizeAttenuation transparent opacity={0.6} />
      </points>
    </group>
  );
}
