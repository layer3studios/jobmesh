// FILE: settings/parts/SettingsPageHeader.tsx
// Shared title block for every /employer/settings/* page: a display title and
// a muted subtitle, with optional right-aligned actions. The mono eyebrow is
// the Breadcrumbs above it — the header does not repeat "Settings".
import type { ReactNode } from 'react';

export default function SettingsPageHeader({ title, subtitle, actions }: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
      <div>
        <h1 className="font-display" style={{ margin: 0, fontSize: 'clamp(1.8rem, 3.5vw, 2.4rem)', fontWeight: 400, letterSpacing: '-0.04em', lineHeight: 1.05, color: 'var(--ink)' }}>{title}</h1>
        {subtitle && (
          <p style={{ margin: '8px 0 0', fontSize: 14, color: 'var(--ink-muted)', lineHeight: 1.55 }}>{subtitle}</p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}
