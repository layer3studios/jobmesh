'use client';
// FILE: src/components/seeker/dashboard/useViewport.ts
import { useState, useEffect } from 'react';

export function useViewport() {
  const [vp, setVp] = useState(() => ({
    w: typeof window !== 'undefined' ? window.innerWidth : 1280,
    h: typeof window !== 'undefined' ? window.innerHeight : 720,
  }));
  useEffect(() => {
    const fn = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    window.addEventListener('resize', fn);
    return () => window.removeEventListener('resize', fn);
  }, []);
  return { ...vp, isMobile: vp.w < 768, useSplit: vp.w >= 768 && vp.h >= 500 };
}
