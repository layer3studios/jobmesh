'use client';
// FILE: src/components/seeker/home/three/PageScene.tsx
// The R3F canvas for the secondary landing pages: one signature object and,
// on a capable device, a soft bloom.
//   field   — /find-work: cubes all over, centred behind centred copy
//   rings   — /companies: concentric orbits
//   lattice — /hire: a quiet grid of nodes behind the whole band
// `isLite` (phones, small windows, weak CPUs) drops the bloom pass, caps DPR
// at 1 and turns off MSAA — the three things that decide whether a page
// scrolls at 60fps with a scene behind it.
import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Bloom, EffectComposer } from '@react-three/postprocessing';
import * as THREE from 'three';
import CubeField from './CubeField';
import RingField from './RingField';
import Lattice from './Lattice';
import { scenePointer } from './pointer-store';

export type PageSceneVariant = 'field' | 'rings' | 'lattice';

const CAMERA_Z = 7.6;
const PARALLAX = 0.5;

function CameraRig() {
  const target = useRef(new THREE.Vector3(0, 0, CAMERA_Z));
  useFrame((state, delta) => {
    const scroll = scenePointer.scrollProgress;
    target.current.set(
      scenePointer.isActive ? scenePointer.x * PARALLAX : 0,
      (scenePointer.isActive ? scenePointer.y * PARALLAX * 0.6 : 0) - scroll * 0.6,
      CAMERA_Z + scroll * 2,
    );
    state.camera.position.lerp(target.current, 1 - Math.pow(0.001, Math.min(delta, 0.05)));
    state.camera.lookAt(0, -scroll * 1.2, 0);
  });
  return null;
}

interface Props { variant: PageSceneVariant; reducedMotion: boolean; isLite: boolean }

export default function PageScene({ variant, reducedMotion, isLite }: Props) {
  return (
    <Canvas
      className="hm-scene"
      dpr={isLite ? 1 : [1, 1.5]}
      camera={{ position: [0, 0, CAMERA_Z], fov: 44, near: 0.1, far: 40 }}
      // Bloom softens edges anyway, so MSAA is paid for twice; leave it off.
      gl={{ antialias: isLite, alpha: true, powerPreference: 'high-performance', stencil: false, depth: true }}
      frameloop={reducedMotion ? 'demand' : 'always'}
      style={{ pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <CameraRig />
        {variant === 'field' && <CubeField isLite={isLite} />}
        {variant === 'rings' && <RingField />}
        {variant === 'lattice' && <Lattice />}
        {!isLite && (
          <EffectComposer multisampling={0} resolutionScale={0.6}>
            <Bloom intensity={0.9} luminanceThreshold={0.2} luminanceSmoothing={0.4} mipmapBlur radius={0.65} />
          </EffectComposer>
        )}
      </Suspense>
    </Canvas>
  );
}
