// FILE: src/components/seeker/dashboard/useViewport.ts
// The dashboard's split-pane decision, layered on the shared viewport hook.
//
// One explicit mode — 'split' or 'sheet' — replaces two booleans that could
// BOTH be false (landscape phone at 800×360: width ≥ 768 → not "mobile",
// height < 500 → not "split", so the old code showed neither the split detail
// pane nor the mobile bottom sheet). The exhaustive union guarantees that every
// viewport gets exactly one layout path.

import { useViewport as useSharedViewport } from '@/hooks/shared/useViewport';

/** Below this height the second pane has no room to be readable. */
const MINIMUM_SPLIT_HEIGHT = 500;

/** The dashboard renders in exactly one of these modes. */
export type DashboardLayoutMode = 'split' | 'sheet';

export function useViewport() {
  const viewport = useSharedViewport();

  const layoutMode: DashboardLayoutMode =
    viewport.isDesktop && viewport.h >= MINIMUM_SPLIT_HEIGHT ? 'split' : 'sheet';

  return {
    ...viewport,
    layoutMode,
  };
}
