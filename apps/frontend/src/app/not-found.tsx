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
      <h1 className="font-display" style={{ fontSize: '2.375rem', marginBottom: 8 }}>Page not found</h1>
      <p style={{ color: 'var(--ink-muted)', marginBottom: 24 }}>
        The page you’re looking for doesn’t exist or has moved.
      </p>
      <Link href="/" className="card" style={{ display: 'inline-block', padding: '10px 16px' }}>
        Back to JobMesh
      </Link>
    </main>
  );
}
