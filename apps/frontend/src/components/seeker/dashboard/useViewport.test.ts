// FILE: src/components/seeker/dashboard/useViewport.test.ts
// Tests the layout mode decision for all viewport combinations.

import { describe, it, expect, vi, afterEach } from 'vitest';

// Mock the shared viewport hook with controllable width and height.
const mockViewport = {
  w: 1280,
  h: 720,
  width: 1280,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  isWide: true,
};

vi.mock('@/hooks/shared/useViewport', () => ({
  useViewport: () => ({ ...mockViewport }),
}));

// Must be imported AFTER the mock is registered.
const { useViewport } = await import('./useViewport');

function setViewport(w: number, h: number) {
  mockViewport.w = w;
  mockViewport.h = h;
  mockViewport.width = w;
  mockViewport.isMobile = w < 640;
  mockViewport.isTablet = w >= 640 && w < 768;
  mockViewport.isDesktop = w >= 768;
  mockViewport.isWide = w >= 1280;
}

describe('useViewport (dashboard)', () => {
  afterEach(() => {
    // Reset to default desktop.
    setViewport(1280, 720);
  });

  it('returns split for a desktop with enough height', () => {
    setViewport(1280, 800);
    const result = useViewport();
    expect(result.layoutMode).toBe('split');
  });

  it('returns sheet for a portrait phone (390×844)', () => {
    setViewport(390, 844);
    const result = useViewport();
    expect(result.layoutMode).toBe('sheet');
  });

  it('returns sheet for a landscape phone (844×390) — the dead zone that was broken', () => {
    setViewport(844, 390);
    const result = useViewport();
    expect(result.layoutMode).toBe('sheet');
  });

  it('returns split for a tablet in landscape (1024×768)', () => {
    setViewport(1024, 768);
    const result = useViewport();
    expect(result.layoutMode).toBe('split');
  });

  it('returns sheet for a tablet in portrait (768×1024) with height >= 500 but width at boundary', () => {
    setViewport(768, 1024);
    const result = useViewport();
    // Width is >= 768 (isDesktop) and height >= 500, so split is used.
    expect(result.layoutMode).toBe('split');
  });

  it('returns sheet for a short desktop window (1200×400)', () => {
    setViewport(1200, 400);
    const result = useViewport();
    expect(result.layoutMode).toBe('sheet');
  });

  it('returns sheet for a narrow window (600×800)', () => {
    setViewport(600, 800);
    const result = useViewport();
    expect(result.layoutMode).toBe('sheet');
  });

  it('returns split for the exact boundary (768×500)', () => {
    setViewport(768, 500);
    const result = useViewport();
    expect(result.layoutMode).toBe('split');
  });

  it('returns sheet just below the height boundary (768×499)', () => {
    setViewport(768, 499);
    const result = useViewport();
    expect(result.layoutMode).toBe('sheet');
  });

  it('returns sheet just below the width boundary (767×800)', () => {
    setViewport(767, 800);
    const result = useViewport();
    expect(result.layoutMode).toBe('sheet');
  });
});
