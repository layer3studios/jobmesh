// FILE: src/app/(apply)/layout.tsx
// Public apply chrome: the wordmark on a glass header with the amber→indigo
// thread beneath (board.css .an-nav), the ambient ground every app page uses,
// and a one-line mono footer. No auth check: unauthenticated candidates. Server
// Component (static content + next/link only). The per-company name is
// page-level data, so the apply pages render the company context themselves.
import Link from 'next/link';
import BrandLogo from '../../components/BrandLogo';
import { COPY } from '../../theme/brand';

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';

export default function ApplyLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column' }}>
      <div className="app-ambient" aria-hidden />
      <header
        className="an-nav"
        style={{
          position: 'sticky', top: 0, zIndex: 'var(--z-nav)' as unknown as number,
          display: 'flex', alignItems: 'center', gap: 12, minHeight: 56, flexShrink: 0,
          padding: '0 var(--margin-page)', borderBottom: '1px solid var(--border)',
          background: 'var(--glass-bg)',
          backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)',
        }}
      >
        <Link href="/" style={{ textDecoration: 'none', flexShrink: 0 }}><BrandLogo size="md" /></Link>
        <span style={{
          fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase',
          color: 'var(--ink-muted)', paddingLeft: 12, borderLeft: '1px solid var(--border)',
        }}>
          Apply
        </span>
      </header>

      <main className="page-enter" style={{ flex: 1, display: 'flex', flexDirection: 'column', position: 'relative' }}>
        {children}
      </main>

      <footer style={{ flexShrink: 0, padding: '18px var(--margin-page)', borderTop: '1px solid var(--border)', textAlign: 'center', position: 'relative' }}>
        <p style={{ fontSize: 12, color: 'var(--ink-faint)', margin: 0, lineHeight: 1.6 }}>
          {COPY.footer.disclaimer}
          {' · '}
          <Link href="/legal/privacy" className="eb-crumb" style={{ color: 'var(--ink-muted)' }}>Privacy</Link>
        </p>
      </footer>
    </div>
  );
}
