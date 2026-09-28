'use client';
// FILE: src/components/seeker/home/three/scene-frameloop.tsx
// Lives inside a landing <Canvas>: stops the render loop while the canvas is
// off-screen or the tab is hidden. The scenes sit in the hero; once the reader
// has scrolled past it, a canvas still rendering (and blooming) 60 times a
// second steals the GPU from the page they are actually looking at, which is
// what made the lower sections stutter on laptops and phones alike.
import { useEffect } from 'react';
import { useThree } from '@react-three/fiber';

export default function SceneFrameloop({ isAnimated }: { isAnimated: boolean }) {
  const setFrameloop = useThree(state => state.setFrameloop);
  const canvas = useThree(state => state.gl.domElement);

  useEffect(() => {
    if (!isAnimated) { setFrameloop('demand'); return; }
    let isOnScreen = true;
    const apply = () => setFrameloop(isOnScreen && !document.hidden ? 'always' : 'never');
    const observer = new IntersectionObserver(([entry]) => {
      isOnScreen = entry.isIntersecting;
      apply();
    });
    observer.observe(canvas);
    document.addEventListener('visibilitychange', apply);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', apply);
    };
  }, [isAnimated, canvas, setFrameloop]);

  return null;
}
