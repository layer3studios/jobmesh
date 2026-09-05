// FILE: src/components/seeker/home/landing-viewport.ts
// The viewport every landing page exports. A page-level `viewport` REPLACES
// the root layout's, so width/scale/fit are restated here alongside the one
// thing the landing needs that the app does not: an ink theme-color.
//
// iOS Safari paints the status bar — the strip beside the dynamic island —
// with the page's theme-color. The app is light, so without this the landing
// gets a parchment band above its ink nav.
import type { Viewport } from 'next';

export const LANDING_VIEWPORT: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#09090B',
  colorScheme: 'dark',
};
