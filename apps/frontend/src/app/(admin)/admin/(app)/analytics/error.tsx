'use client';
// FILE: src/app/(admin)/admin/analytics/error.tsx
// Route error boundary for the analytics dashboard. Catches unexpected fetch/render
// failures (the page handles 503/401/403 itself, so those never reach here) and offers
// a retry via reset().
import { useEffect } from 'react';
import { Button } from '@/components/ui';

export default function AnalyticsError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Surface for observability; the message is generic to the user below.
    console.error('[admin-analytics] render error', error);
  }, [error]);

  return (
    <div style={{ maxWidth: 520, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>
        Something went wrong loading analytics
      </h1>
      <p style={{ fontSize: '0.95rem', color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: 20 }}>
        The dashboard could not be loaded. This is usually transient — try again.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
