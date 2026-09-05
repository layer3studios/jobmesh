'use client';
// FILE: src/components/seeker/home/three/use-scene-quality.ts
// One decision for every 3D host: how much scene can this device afford?
//   reducedMotion — the user asked for stillness: one frame, no loop.
//   isLite        — a phone or a small window: no bloom pass, DPR 1, fewer
//                   pieces. The bloom is the expensive part of every scene and
//                   a phone GPU cannot afford it at 60fps on top of a page.
// Also mounts the scene one frame late, so the statement paints first.
import { useEffect, useState } from 'react';

export interface SceneQuality { reducedMotion: boolean; isLite: boolean; isReady: boolean }

const LITE_MAX_WIDTH = 900;

export function useSceneQuality(): SceneQuality {
  const [quality, setQuality] = useState<SceneQuality>({ reducedMotion: false, isLite: false, isReady: false });

  useEffect(() => {
    const decide = (): SceneQuality => ({
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      isLite: window.innerWidth < LITE_MAX_WIDTH || (navigator.hardwareConcurrency ?? 8) <= 4,
      isReady: true,
    });
    const id = requestAnimationFrame(() => setQuality(decide()));
    const onResize = () => setQuality(decide());
    window.addEventListener('resize', onResize);
    return () => { cancelAnimationFrame(id); window.removeEventListener('resize', onResize); };
  }, []);

  return quality;
}
