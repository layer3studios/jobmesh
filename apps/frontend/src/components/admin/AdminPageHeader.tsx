// FILE: src/components/admin/AdminPageHeader.tsx
// The title block every admin panel shares: an ADMIN mono eyebrow, the page
// title in the display face, an optional muted subtitle, and right-aligned
// actions. Server-safe — no state, no handlers — so a server page can use it
// as freely as a client island. Owns no outer margin: the page's column gap
// provides the rhythm, as it already did for the old h1 blocks.
import type { ReactNode } from 'react';

const MONO = 'var(--font-jetbrains-mono), ui-monospace, monospace';

export default function AdminPageHeader({ title, subtitle, actions, eyebrow = 'Admin' }: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
      <div style={{ minWidth: 0 }}>
        <p style={{ margin: '0 0 8px', fontFamily: MONO, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--ink-muted)' }}>{eyebrow}</p>
        <h1 className="font-display" style={{ margin: 0, fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.05, color: 'var(--ink)' }}>{title}</h1>
        {subtitle && <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.55 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>{actions}</div>}
    </div>
  );
}
