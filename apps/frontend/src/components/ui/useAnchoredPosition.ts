'use client';
// FILE: src/components/ui/useAnchoredPosition.ts
// Places a portalled popover next to its trigger and keeps it inside the viewport.
// Split out of ActionsMenu.tsx (naming conventions section 2).
//
// Its own file because it is a general primitive, not menu markup: it measures a
// trigger and returns coordinates, and nothing about it knows what is rendered
// into them.

import { useCallback, useEffect, useLayoutEffect, useState } from 'react';

/** Viewport gap between the trigger and the panel, and from the viewport edge. */
const ANCHOR_GAP = 4;

const VIEWPORT_MARGIN = 8;

export interface AnchoredPosition { top: number; left: number }

/**
 * Position a floating panel against a trigger, in VIEWPORT coordinates.
 *
 * Pair this with `position: fixed` and a portal to document.body. An
 * absolutely-positioned panel is laid out inside its nearest positioned ancestor,
 * so any ancestor with `overflow: auto/hidden` either clips it or grows a
 * scrollbar to contain it — which is exactly what the jobs table (overflow:auto),
 * the ranked table and the pipeline column (overflow:hidden) were doing. Taking
 * the panel out of the document flow entirely is the only fix that holds
 * regardless of what wraps the trigger.
 *
 * Because the panel no longer participates in layout, it also cannot lengthen the
 * page — so no body scroll-lock is needed, and none is applied (locking would
 * itself shift the layout by the scrollbar width).
 *
 * Recomputed on scroll (capture-phase, so ancestor scrollers count) and resize,
 * so a fixed panel stays glued to its trigger instead of drifting.
 */
export function useAnchoredPosition(
  anchorRef: React.RefObject<HTMLElement | null>,
  panelRef: React.RefObject<HTMLElement | null>,
  isOpen: boolean,
): AnchoredPosition | null {
  const [position, setPosition] = useState<AnchoredPosition | null>(null);

  const measure = useCallback(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;
    const rect = anchor.getBoundingClientRect();
    const panel = panelRef.current;
    const width = panel?.offsetWidth ?? 0;
    const height = panel?.offsetHeight ?? 0;

    // Flip above when there is not enough room below for the real panel height.
    const spaceBelow = window.innerHeight - rect.bottom;
    const flipAbove = height > 0 && spaceBelow < height + ANCHOR_GAP + VIEWPORT_MARGIN;
    const top = flipAbove ? rect.top - height - ANCHOR_GAP : rect.bottom + ANCHOR_GAP;

    // Right-aligned to the trigger, then clamped so it never leaves the viewport.
    const maxLeft = window.innerWidth - width - VIEWPORT_MARGIN;
    const left = Math.max(VIEWPORT_MARGIN, Math.min(rect.right - width, maxLeft));

    setPosition({ top: Math.max(VIEWPORT_MARGIN, top), left });
  }, [anchorRef, panelRef]);

  // Layout effect so the first paint is already in the right place — a passive
  // effect would show one frame at the top-left corner.
  useLayoutEffect(() => {
    if (!isOpen) { setPosition(null); return; }
    measure();
  }, [isOpen, measure]);

  useEffect(() => {
    if (!isOpen) return;
    const onChange = () => measure();
    window.addEventListener('scroll', onChange, true);
    window.addEventListener('resize', onChange);
    return () => {
      window.removeEventListener('scroll', onChange, true);
      window.removeEventListener('resize', onChange);
    };
  }, [isOpen, measure]);

  return position;
}
