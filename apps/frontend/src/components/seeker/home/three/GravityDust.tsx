'use client';
// FILE: src/components/seeker/home/three/GravityDust.tsx
// The dust field, and the lines that wire the visitor into it. Every mote is
// a body under two forces: a weak well at the globe's centre, and the pointer
// as a stronger, softened inverse-square well — motes accelerate toward the
// cursor and swing past it (an orbit, not a magnet). Hairlines run from the
// pointer to its nearest motes, so the mesh visibly reaches for whoever moves.
// Positions live in one Float32Array and are written straight into the GPU
// buffer each frame; nothing here allocates per frame.
import { useMemo, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { scenePointer } from './pointer-store';

const COUNT = 420;
const FIELD = 4.6;              // world units — spawn radius
const CENTRE_PULL = 0.06;
const POINTER_PULL = 3.4;
const POINTER_SOFTENING = 0.9;
const POINTER_REACH = 3.2;
const DRAG = 0.985;
const MAX_SPEED = 0.06;
const LINK_COUNT = 8;
const LINK_REACH = 1.9;

export default function GravityDust() {
  const viewport = useThree(state => state.viewport);
  const pointsRef = useRef<THREE.Points>(null);
  const linesRef = useRef<THREE.LineSegments>(null);

  const { positions, velocities, linePositions } = useMemo(() => {
    const positions = new Float32Array(COUNT * 3);
    const velocities = new Float32Array(COUNT * 3);
    for (let index = 0; index < COUNT; index += 1) {
      const angle = Math.random() * Math.PI * 2;
      const distance = FIELD * (0.3 + Math.random() * 0.9);
      positions[index * 3] = Math.cos(angle) * distance;
      positions[index * 3 + 1] = Math.sin(angle) * distance * 0.7;
      positions[index * 3 + 2] = (Math.random() - 0.5) * 1.6;
      // Launched along the tangent so the field is already orbiting on frame 1.
      velocities[index * 3] = Math.cos(angle + Math.PI / 2) * 0.012;
      velocities[index * 3 + 1] = Math.sin(angle + Math.PI / 2) * 0.012;
    }
    return { positions, velocities, linePositions: new Float32Array(LINK_COUNT * 2 * 3) };
  }, []);

  // Pointer → nearest motes, kept as a small sorted list in fixed arrays.
  // Pushing an object per mote per frame fed the garbage collector ~25k
  // objects a second, and its pauses showed up as periodic stutters.
  const nearestIndex = useMemo(() => new Int32Array(LINK_COUNT), []);
  const nearestDistance = useMemo(() => new Float32Array(LINK_COUNT), []);

  useFrame((_, delta) => {
    const points = pointsRef.current;
    const lines = linesRef.current;
    if (!points || !lines) return;
    const frameScale = Math.min(delta, 0.05) * 60;
    const pointerX = scenePointer.x * viewport.width / 2;
    const pointerY = scenePointer.y * viewport.height / 2;
    const isActive = scenePointer.isActive;
    const drag = Math.pow(DRAG, frameScale);
    const limitX = viewport.width / 2 + 0.5;
    const limitY = viewport.height / 2 + 0.5;

    let found = 0;
    for (let index = 0; index < COUNT; index += 1) {
      const i = index * 3;
      const x = positions[i];
      const y = positions[i + 1];
      const centreDistance = Math.hypot(x, y) || 1;
      velocities[i] += (-x / centreDistance) * CENTRE_PULL * 0.01 * frameScale;
      velocities[i + 1] += (-y / centreDistance) * CENTRE_PULL * 0.01 * frameScale;

      if (isActive) {
        const dx = pointerX - x;
        const dy = pointerY - y;
        const distance = Math.hypot(dx, dy);
        if (distance < POINTER_REACH) {
          const pull = (POINTER_PULL / (distance * distance + POINTER_SOFTENING * POINTER_SOFTENING)) * 0.001 * frameScale;
          const unit = distance || 1;
          velocities[i] += (dx / unit) * pull;
          velocities[i + 1] += (dy / unit) * pull;
        }
        if (distance < LINK_REACH && (found < LINK_COUNT || distance < nearestDistance[found - 1])) {
          let slot = found < LINK_COUNT ? found++ : LINK_COUNT - 1;
          while (slot > 0 && nearestDistance[slot - 1] > distance) {
            nearestDistance[slot] = nearestDistance[slot - 1];
            nearestIndex[slot] = nearestIndex[slot - 1];
            slot -= 1;
          }
          nearestDistance[slot] = distance;
          nearestIndex[slot] = index;
        }
      }

      velocities[i] *= drag;
      velocities[i + 1] *= drag;
      const speed = Math.hypot(velocities[i], velocities[i + 1]);
      if (speed > MAX_SPEED) {
        velocities[i] = (velocities[i] / speed) * MAX_SPEED;
        velocities[i + 1] = (velocities[i + 1] / speed) * MAX_SPEED;
      }
      positions[i] += velocities[i] * frameScale;
      positions[i + 1] += velocities[i + 1] * frameScale;

      // Wrap, so the field keeps its density without visible walls.
      if (positions[i] > limitX) positions[i] = -limitX; else if (positions[i] < -limitX) positions[i] = limitX;
      if (positions[i + 1] > limitY) positions[i + 1] = -limitY; else if (positions[i + 1] < -limitY) positions[i + 1] = limitY;
    }
    (points.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;

    // Connection lines: pointer → its nearest motes.
    const linkCount = isActive ? found : 0;
    for (let link = 0; link < linkCount; link += 1) {
      const target = nearestIndex[link] * 3;
      const out = link * 6;
      linePositions[out] = pointerX;
      linePositions[out + 1] = pointerY;
      linePositions[out + 2] = 0;
      linePositions[out + 3] = positions[target];
      linePositions[out + 4] = positions[target + 1];
      linePositions[out + 5] = positions[target + 2];
    }
    lines.geometry.setDrawRange(0, linkCount * 2);
    (lines.geometry.attributes.position as THREE.BufferAttribute).needsUpdate = true;
  });

  return (
    <>
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#ffffff" size={0.028} sizeAttenuation transparent opacity={0.55} depthWrite={false} />
      </points>
      <lineSegments ref={linesRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#ffffff" transparent opacity={0.4} depthWrite={false} />
      </lineSegments>
    </>
  );
}
