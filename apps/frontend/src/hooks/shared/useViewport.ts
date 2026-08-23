'use client';
// FILE: src/hooks/shared/useViewport.ts
// The ONE viewport hook. Every component that needs to know how wide the window is
// reads it from here rather than attaching its own resize listener.
//
// THE RETURN SHAPE IS A SUPERSET, DELIBERATELY. `w`/`h` are the original fields and
// several shells already compare `vp.w` directly; `width` and the boolean flags are
// the new, readable form. Dropping w/h to "clean up" would have been a silent
// breaking change across every consumer for no behavioural gain.
//
// `h` matters: the seeker dashboard decides on its split-pane layout from HEIGHT as
// well as width, because a short landscape phone cannot host two stacked panes.

import { useState, useEffect } from 'react';
import { BREAKPOINTS } from '../../theme/tokens';

/** SSR has no window. Desktop is the safe assumption: it renders the full layout,
 *  which then narrows on hydration, rather than flashing a mobile shell on a laptop. */
const SERVER_WIDTH = BREAKPOINTS.wide;
const SERVER_HEIGHT = 720;

export interface Viewport {
  /** Window width in pixels. */
  w: number;
  /** Window height in pixels. Used where vertical room changes the layout. */
  h: number;
  /** Alias of `w`, for call sites that read better as `width`. */
  width: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  isWide: boolean;
}

function readViewport(): { w: number; h: number } {
  if (typeof window === 'undefined') return { w: SERVER_WIDTH, h: SERVER_HEIGHT };
  return { w: window.innerWidth, h: window.innerHeight };
}

export function useViewport(): Viewport {
  const [vp, setVp] = useState(readViewport);

  useEffect(() => {
    const onResize = () => setVp(readViewport());
    // Run once on mount: the first client render used the SSR default, and a phone
    // that never fires resize would otherwise keep the desktop layout.
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return {
    ...vp,
    width: vp.w,
    isMobile: vp.w < BREAKPOINTS.mobile,
    isTablet: vp.w >= BREAKPOINTS.mobile && vp.w < BREAKPOINTS.tablet,
    isDesktop: vp.w >= BREAKPOINTS.tablet,
    isWide: vp.w >= BREAKPOINTS.wide,
  };
}
