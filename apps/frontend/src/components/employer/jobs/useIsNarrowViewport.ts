// FILE: src/components/employer/jobs/useIsNarrowViewport.ts
// True below 768px — drives the Ranked sidebar's collapse into a drawer and the
// settings sidebar's collapse into tabs.
//
// Kept as a named alias rather than deleted: five call sites read as
// `const isNarrow = useIsNarrowViewport()`, which says what those layouts actually
// branch on. It no longer owns a matchMedia listener — the shared useViewport is
// the one place a resize is observed.

import { useViewport } from '@/hooks/shared/useViewport';

export function useIsNarrowViewport(): boolean {
  // isDesktop is >= 768 (BREAKPOINTS.tablet), so its negation is the old query.
  return !useViewport().isDesktop;
}
