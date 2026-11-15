// FILE: src/types/tracking-globals.d.ts
// Globals injected by the third-party tags that lib/tracking.ts loads. Declared
// here (never `any` at the call site) so every push is type-checked.
//
// gtag's real signature takes the `arguments` object, not an array — GA's own
// snippet does `dataLayer.push(arguments)`. We mirror that in lib/tracking.ts.

interface ClarityApi {
  (...args: unknown[]): void;
  /** Call queue the install snippet fills until the real tag replaces it. */
  q?: unknown[];
}

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
    clarity?: ClarityApi;
  }
}

export {};
