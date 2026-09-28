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

/**
 * Attach window listeners that keep the pointer half of `scenePointer` current
 * for a canvas host. Scroll progress is NOT tracked here: ScrollMotion drives
 * it from ScrollTrigger, on the same clock as Lenis. A second writer on the raw
 * `scroll` event read a slightly different value every frame, and the camera
 * shook between the two.
 */
export function trackPointer(host: HTMLElement): () => void {
  scenePointer.scrollProgress = 0;
  scenePointer.isActive = false;
  const onMove = (event: PointerEvent) => {
    // Only a mouse aims the camera. A finger dragging the page on a phone
    // fires pointermove too, and used to yank the scene toward the thumb
    // mid-scroll.
    if (event.pointerType !== 'mouse') return;
    const rect = host.getBoundingClientRect();
    const insideY = event.clientY >= rect.top && event.clientY <= rect.bottom;
    scenePointer.x = ((event.clientX - rect.left) / (rect.width || 1)) * 2 - 1;
    scenePointer.y = -(((event.clientY - rect.top) / (rect.height || 1)) * 2 - 1);
    scenePointer.isActive = insideY;
  };
  const onLeave = () => { scenePointer.isActive = false; };
  window.addEventListener('pointermove', onMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', onLeave);
  return () => {
    window.removeEventListener('pointermove', onMove);
    document.documentElement.removeEventListener('pointerleave', onLeave);
  };
}
