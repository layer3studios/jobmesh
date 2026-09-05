// FILE: src/app/not-found.tsx
// Replaces the Vite app's `<Route path="*" element={<Navigate to="/">} />`. In App
// Router a not-found renders this instead of redirecting. noindex (D_impl_6).
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false },
};

export default function NotFound() {
  return (
    <main className="container-md" style={{ padding: '64px 16px', textAlign: 'center' }}>
      <p style={{ fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace', fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)', marginBottom: 10 }}>404</p>
      <h1 className="font-display" style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.05, marginBottom: 10 }}>Page not found.</h1>
      <p style={{ color: 'var(--ink-muted)', marginBottom: 24 }}>
        The page you’re looking for doesn’t exist or has moved.
      </p>
      <Link href="/" className="an-solid" style={{ display: 'inline-block', padding: '10px 18px', borderRadius: 8, background: 'var(--ink)', color: 'var(--paper)', textDecoration: 'none', fontSize: 14, fontWeight: 500 }}>
        Back to JobMesh
      </Link>
    </main>
  );
}
