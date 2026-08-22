'use client';
// FILE: src/app/(seeker)/error.tsx
// Route-group error boundary. Renders a calm "something went wrong" fallback (with a
// retry) instead of Next's default overlay when an SSR fetch throws — e.g. the
// backend times out (ServerFetchError code UPSTREAM_TIMEOUT) during a seeker render.
import { useEffect } from 'react';

export default function SeekerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);

  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 420, textAlign: 'center' }}>
        <h1 className="font-display" style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>
          Something went wrong
        </h1>
        <p style={{ fontSize: '0.9rem', color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: 20 }}>
          We couldn&apos;t load this page just now. Please try again in a moment.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '9px 18px', borderRadius: 10, cursor: 'pointer',
            background: 'var(--ink)', color: 'var(--paper)', border: 'none',
            fontFamily: 'inherit', fontSize: '0.875rem', fontWeight: 500,
          }}
        >
          Try again
        </button>
      </div>
    </div>
  );
}
