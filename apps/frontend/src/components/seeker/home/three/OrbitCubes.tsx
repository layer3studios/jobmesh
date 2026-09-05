'use client';
// FILE: src/components/seeker/home/three/OrbitCubes.tsx
// Three wireframe cubes in orbit round the globe — each on its own radius,
// its own tilted plane and its own tumble, so they pass behind and in front
// of the mesh and never line up. Real edges (EdgesGeometry) so the wireframe
// is twelve clean lines, not triangulated faces.
import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { scenePointer } from './pointer-store';

interface Satellite {
  orbit: number; size: number; speed: number; phase: number; tilt: number;
  tumbleX: number; tumbleY: number; opacity: number;
}

const SATELLITES: Satellite[] = [
  { orbit: 2.35, size: 0.26, speed: 0.22, phase: 0.0, tilt: 0.42, tumbleX: 0.9, tumbleY: 0.7, opacity: 0.75 },
  { orbit: 2.85, size: 0.17, speed: -0.16, phase: 2.1, tilt: -0.55, tumbleX: 0.6, tumbleY: 1.1, opacity: 0.6 },
  { orbit: 3.3, size: 0.21, speed: 0.12, phase: 4.2, tilt: 0.18, tumbleX: 1.2, tumbleY: 0.5, opacity: 0.5 },
];

function Cube({ satellite, edges }: { satellite: Satellite; edges: THREE.EdgesGeometry }) {
  const ref = useRef<THREE.LineSegments>(null);
  const clock = useRef(satellite.phase);

  useFrame((_, delta) => {
    const cube = ref.current;
    if (!cube) return;
    clock.current += Math.min(delta, 0.05);
    const t = clock.current;
    const angle = t * satellite.speed;
    const drop = scenePointer.scrollProgress;
    cube.position.set(
      Math.cos(angle) * satellite.orbit,
      Math.sin(angle) * satellite.orbit * Math.sin(satellite.tilt) - drop * 1.6,
      Math.sin(angle) * satellite.orbit * Math.cos(satellite.tilt),
    );
    cube.rotation.x = t * satellite.tumbleX;
    cube.rotation.y = t * satellite.tumbleY;
    cube.scale.setScalar(satellite.size * (1 - drop * 0.4));
  });

  return (
    <lineSegments ref={ref} geometry={edges}>
      <lineBasicMaterial color="#ffffff" transparent opacity={satellite.opacity} />
    </lineSegments>
  );
}

export default function OrbitCubes() {
  const edges = useMemo(() => new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1)), []);
  return (
    <>
      {SATELLITES.map(satellite => <Cube key={satellite.phase} satellite={satellite} edges={edges} />)}
    </>
  );
}
