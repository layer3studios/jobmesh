'use client';
// FILE: src/components/seeker/home/three/HeroScene.tsx
// The R3F canvas for the landing hero: globe, orbiting cubes, gravity dust,
// and on a capable device a bloom pass so every white hairline glows. The
// camera drifts toward the pointer for parallax and pulls back on scroll.
// `isLite` drops the dust and the bloom, caps DPR at 1 — the phone budget.
import { Suspense, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { EffectComposer, Bloom, Vignette } from '@react-three/postprocessing';
import * as THREE from 'three';
import MeshGlobe from './MeshGlobe';
import OrbitCubes from './OrbitCubes';
import GravityDust from './GravityDust';
import { scenePointer } from './pointer-store';

const CAMERA_Z = 6.2;
const PARALLAX = 0.55;

/** Camera parallax + scroll pull-back, eased so a fast flick never jolts. */
function CameraRig() {
  const target = useRef(new THREE.Vector3(0, 0, CAMERA_Z));
  useFrame((state, delta) => {
    const scroll = scenePointer.scrollProgress;
    target.current.set(
      scenePointer.isActive ? scenePointer.x * PARALLAX : 0,
      (scenePointer.isActive ? scenePointer.y * PARALLAX * 0.6 : 0) - scroll * 0.8,
      CAMERA_Z + scroll * 2.4,
    );
    state.camera.position.lerp(target.current, 1 - Math.pow(0.001, Math.min(delta, 0.05)));
    state.camera.lookAt(0, -scroll * 1.2, 0);
  });
  return null;
}

interface Props { reducedMotion: boolean; isLite: boolean }

export default function HeroScene({ reducedMotion, isLite }: Props) {
  return (
    <Canvas
      className="hm-scene"
      dpr={isLite ? 1 : [1, 1.5]}
      camera={{ position: [0, 0, CAMERA_Z], fov: 42, near: 0.1, far: 40 }}
      gl={{ antialias: isLite, alpha: true, powerPreference: 'high-performance', stencil: false }}
      frameloop={reducedMotion ? 'demand' : 'always'}
      style={{ pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <CameraRig />
        <MeshGlobe />
        <OrbitCubes />
        {!reducedMotion && !isLite && <GravityDust />}
        {!isLite && (
          <EffectComposer multisampling={0} resolutionScale={0.6}>
            <Bloom intensity={1.1} luminanceThreshold={0.18} luminanceSmoothing={0.35} mipmapBlur radius={0.7} />
            <Vignette eskil={false} offset={0.2} darkness={0.55} />
          </EffectComposer>
        )}
      </Suspense>
    </Canvas>
  );
}
