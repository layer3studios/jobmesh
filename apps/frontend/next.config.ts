import type { NextConfig } from 'next';

// Same-origin invariant (AUTH-PLAN §5, C10): in production nginx serves both the
// Next app and /api/* same-origin, so no rewrite is needed. In local dev the
// Express backend runs on a separate port, so we rewrite /api/* to it. The dev
// backend origin comes ONLY from an env var — never hardcoded (C10); the default
// lives in .env.example. When unset, no rewrite is added.
const devApiOrigin = process.env.DEV_API_PROXY_ORIGIN;

const nextConfig: NextConfig = {
  // Self-hosted pm2 target (R6, NEXTJS-DECISIONS D11).
  output: 'standalone',
  // Type safety is enforced by `tsc --noEmit` and lint by a separate `next lint`
  // run (both in CI). The build's own lint pass otherwise reports errors in Next's
  // own generated `.next/types/validator.ts`, which is not source we control.
  eslint: { ignoreDuringBuilds: true },
  async rewrites() {
    // Only proxy in dev; in prod the same-origin nginx handles /api/*.
    if (process.env.NODE_ENV === 'production' || !devApiOrigin) return [];
    return [{ source: '/api/:path*', destination: `${devApiOrigin}/api/:path*` }];
  },
  async headers() {
    // @react-oauth/google opens a popup and talks to it via postMessage. Next 15
    // defaults to a stricter Cross-Origin-Opener-Policy that severs that channel,
    // so the sign-in popup never resolves. 'same-origin-allow-popups' keeps the
    // isolation for normal windows while letting the OAuth popup communicate.
    return [
      {
        source: '/:path*',
        headers: [{ key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' }],
      },
    ];
  },
};

export default nextConfig;
