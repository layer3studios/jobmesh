'use client';
// FILE: src/app/(admin)/admin/(app)/team/error.tsx
// Route error boundary for the team page. Mirrors the analytics boundary: the page
// handles 401/403 itself, so only unexpected fetch/render failures land here.
import { useEffect } from 'react';
import { Button } from '@/components/ui';

export default function TeamError({ error, reset }: { error: Error; reset: () => void }) {
  useEffect(() => {
    // Surface for observability; the message below stays generic to the user.
    console.error('[admin-team] render error', error);
  }, [error]);

  return (
    <div style={{ maxWidth: 520, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
      <h1 style={{ fontSize: '1.3rem', fontWeight: 600, color: 'var(--ink)', marginBottom: 10 }}>
        Something went wrong loading the team
      </h1>
      <p style={{ fontSize: '0.95rem', color: 'var(--ink-muted)', lineHeight: 1.6, marginBottom: 20 }}>
        The roster could not be loaded. This is usually transient — try again.
      </p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  );
}
