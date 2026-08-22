'use client';
// FILE: src/app/(employer)/error.tsx
// Route-group error boundary for the employer surfaces. Same calm fallback + retry as
// the seeker boundary; catches SSR fetch failures (e.g. UPSTREAM_TIMEOUT from the
// employer session guard) instead of showing Next's default error overlay.
import { useEffect } from 'react';

export default function EmployerError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
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
