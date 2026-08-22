// FILE: src/components/layouts/AuthLayout.tsx
// Centered card layout for login / signup pages.
import type { ReactNode } from 'react';
import { Card } from '@/components/ui';
import { BRAND, BRAND_SPLIT } from '@/theme/brand';
import { TYPE } from '@/theme/tokens';

export default function AuthLayout({ children }: { children?: ReactNode }) {
  return (
    <div
      style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 24,
        background: 'var(--surface-sunken)', padding: 24,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <span className="font-display" style={{ fontSize: TYPE['2xl'], fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
          {BRAND_SPLIT.first}
          <span style={{ color: 'var(--accent)' }}>{BRAND_SPLIT.accent}</span>
        </span>
        <p style={{ fontSize: TYPE.sm, color: 'var(--ink-muted)', marginTop: 4 }}>{BRAND.tagline}</p>
      </div>

      <Card variant="raised" style={{ width: '100%', maxWidth: 420 }}>
        {children}
      </Card>
    </div>
  );
}
