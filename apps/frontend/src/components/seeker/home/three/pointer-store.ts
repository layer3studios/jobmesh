// FILE: src/components/seeker/home/three/pointer-store.ts
// One shared, mutable pointer + scroll record for the 3D scene. The canvas is
// pointer-events:none (the page must stay clickable through it), so R3F never
// sees the mouse — the DOM wrapper tracks it and writes here, and every
// useFrame reads it. Plain object on purpose: it changes 60× a second and must
// never trigger a React render.

export interface ScenePointer {
  /** Normalised device coords, -1…1, relative to the canvas. */
  x: number;
  y: number;
  isActive: boolean;
  /** 0 at the top of the hero, 1 once it has scrolled fully out of view. */
  scrollProgress: number;
}

export const scenePointer: ScenePointer = { x: 0, y: 0, isActive: false, scrollProgress: 0 };

/** Attach window listeners that keep `scenePointer` current for a canvas host. */
export function trackPointer(host: HTMLElement): () => void {
  const onMove = (event: PointerEvent) => {
    const rect = host.getBoundingClientRect();
    const insideY = event.clientY >= rect.top && event.clientY <= rect.bottom;
    scenePointer.x = ((event.clientX - rect.left) / (rect.width || 1)) * 2 - 1;
    scenePointer.y = -(((event.clientY - rect.top) / (rect.height || 1)) * 2 - 1);
    scenePointer.isActive = insideY;
  };
  const onLeave = () => { scenePointer.isActive = false; };
  const onScroll = () => {
    const rect = host.getBoundingClientRect();
    scenePointer.scrollProgress = Math.min(1, Math.max(0, -rect.top / (rect.height || 1)));
  };
  window.addEventListener('pointermove', onMove, { passive: true });
  window.addEventListener('pointerleave', onLeave);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  return () => {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('scroll', onScroll);
  };
}
