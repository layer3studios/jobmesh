// FILE: src/theme/tokens.ts
// Design tokens. Single source for spacing, radius, motion, type.

export const RADIUS = {
  xs: '6px', sm: '8px', md: '10px', lg: '14px', xl: '18px', '2xl': '24px', pill: '999px',
} as const;

export const SPACING = {
  px: '1px', 0: '0',
  1: '4px', 2: '8px', 3: '12px', 4: '16px',
  5: '20px', 6: '24px', 7: '28px', 8: '32px',
  10: '40px', 12: '48px', 14: '56px', 16: '64px',
  20: '80px', 24: '96px',
} as const;

export const TYPE = {
  sans: "'Inter', ui-sans-serif, -apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
  serif: "'Source Serif 4', 'Iowan Old Style', 'Apple Garamond', Georgia, ui-serif, serif",
  mono: "'JetBrains Mono', ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, monospace",
  xs: '0.75rem', sm: '0.8125rem', base: '0.9375rem', md: '1rem', lg: '1.125rem',
  xl: '1.25rem', '2xl': '1.5rem', '3xl': '1.875rem', '4xl': '2.375rem', '5xl': '3rem',
  regular: 400, medium: 500, semibold: 600, bold: 700,
  tight: 1.15, snug: 1.3, normal: 1.5, relaxed: 1.65,
  lsTight: '-0.022em', lsNormal: '0', lsWide: '0.04em',
} as const;

export const MOTION = {
  fast: '120ms', normal: '200ms', slow: '320ms',
  ease: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
  spring: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

/**
 * The one stacking order. Every layered element in the app resolves to a tier
 * here — no raw numbers, and NOTHING sits above `toast`.
 *
 * The old scale topped out at 80 while five components hardcoded 100–9999, so a
 * toast rendered behind the consent banner and a modal rendered behind every nav
 * dropdown. The tiers below are spaced 10 apart so a future layer can slot
 * between two without renumbering the rest.
 *
 * Mirrored as --z-* custom properties in theme-tokens.css for stylesheets, which
 * cannot import this file.
 */
export const Z = {
  base: 0,
  card: 10,
  sticky: 40,
  /** Popovers, action menus, filter dropdowns. */
  dropdown: 50,
  nav: 60,
  /** Bottom sheets and side panels that cover the nav. */
  sheet: 70,
  /** Full-screen scrims and banners. */
  overlay: 80,
  /** Modals and dialogs — above everything except toasts. */
  modal: 90,
  /** Always on top. Nothing may exceed this. */
  toast: 100,
} as const;

// Box-shadow tokens. These reference the theme CSS variables (defined in
// themes.ts) so shadows adapt automatically between light and dark mode.
// `focus` is the standard focus ring used by all interactive primitives.
export const SHADOW = {
  xs: 'var(--shadow-xs)',
  sm: 'var(--shadow-sm)',
  md: 'var(--shadow-md)',
  lg: 'var(--shadow-lg)',
  focus: 'var(--focus-ring)',
} as const;
