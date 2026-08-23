// FILE: src/components/seeker/dashboard/useViewport.ts
// The dashboard's split-pane decision, layered on the shared viewport hook.
//
// KEPT as its own hook because `useSplit` is a real rule this page owns and no
// breakpoint token can express: the two-pane layout needs both enough WIDTH for a
// second column and enough HEIGHT to be worth splitting — a short landscape phone
// is wide enough and still wrong for it. Everything underneath (the resize
// listener, the SSR default, the width thresholds) now comes from the shared hook.

import { useViewport as useSharedViewport } from '@/hooks/shared/useViewport';

/** Below this the second pane has no room to be readable. */
const MINIMUM_SPLIT_HEIGHT = 500;

export function useViewport() {
  const viewport = useSharedViewport();
  return {
    ...viewport,
    // Unchanged behaviour: this was `vp.w < 768` before BREAKPOINTS existed.
    isMobile: !viewport.isDesktop,
    useSplit: viewport.isDesktop && viewport.h >= MINIMUM_SPLIT_HEIGHT,
  };
}
