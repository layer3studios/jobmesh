'use client';
// FILE: src/components/seeker/home/HeroScene3D.tsx
// DOM host for the landing hero's Three.js scene. Loads the R3F bundle only
// on the client (never in the SSR path, never blocking the statement), tracks
// the pointer and scroll for the scene, and hands down the device's budget.
import dynamic from 'next/dynamic';
import { useEffect, useRef } from 'react';
import { trackPointer } from './three/pointer-store';
import { useSceneQuality } from './three/use-scene-quality';

const HeroScene = dynamic(() => import('./three/HeroScene'), { ssr: false });

export default function HeroScene3D() {
  const hostRef = useRef<HTMLDivElement>(null);
  const { reducedMotion, isLite, isReady } = useSceneQuality();

  useEffect(() => {
    const host = hostRef.current;
    return host ? trackPointer(host) : undefined;
  }, []);

  return (
    <div ref={hostRef} className="hm-scene-host" aria-hidden="true">
      {isReady && <HeroScene reducedMotion={reducedMotion} isLite={isLite} />}
    </div>
  );
}
