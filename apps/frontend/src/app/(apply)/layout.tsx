// FILE: src/app/(apply)/layout.tsx
// Public apply layout — verbatim adaptation of the Vite PublicLayout chrome
// (header brand + footer disclaimer/privacy). No auth check: unauthenticated
// candidates. Server Component (static content + next/link only). The per-company
// name that PublicLayout showed beside the brand is page-level data, so the apply
// pages render the company context themselves; the shared chrome stays here.
import Link from 'next/link';
import { BRAND_SPLIT, COPY } from '../../theme/brand';
import { TYPE } from '../../theme/tokens';

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', background: 'var(--paper)' }}>
      <header
        style={{
          height: 56, flexShrink: 0, display: 'flex', alignItems: 'center', gap: 10,
          padding: '0 24px', borderBottom: '1px solid var(--border)', background: 'var(--surface)',
        }}
      >
        <Link href="/" className="font-display" style={{ fontSize: TYPE.lg, fontWeight: 700, color: 'var(--ink)', letterSpacing: '-0.02em', textDecoration: 'none' }}>
          {BRAND_SPLIT.first}
          <span style={{ color: 'var(--accent)' }}>{BRAND_SPLIT.accent}</span>
        </Link>
      </header>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {children}
      </main>

      <footer style={{ flexShrink: 0, padding: '16px 24px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
        <p style={{ fontSize: TYPE.xs, color: 'var(--ink-faint)', margin: 0 }}>
          {COPY.footer.disclaimer}
          {' · '}
          <Link href="/legal/privacy" style={{ color: 'var(--ink-muted)' }}>Privacy</Link>
        </p>
      </footer>
    </div>
  );
}
